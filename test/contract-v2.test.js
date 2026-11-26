import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ganache from 'ganache';
import solc from 'solc';
import { createPublicClient,createWalletClient,custom,keccak256,decodeErrorResult,encodeFunctionData } from 'viem';

// The production artifact is deployed unchanged. Its fixed precompile address
// 0x...0a02 gets local mock code via evm_setAccountCode, so the same deployed
// control flow that runs on Diana is exercised here. LOCAL ONLY - not Diana.
const PQC='0x0000000000000000000000000000000000000a02';
const art=JSON.parse(fs.readFileSync(new URL('../artifacts/FuturePostReleaseV2.json',import.meta.url)));
const mockOut=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'M.sol':{content:fs.readFileSync(new URL('./fixtures/MockPqcKeyStatus.sol',import.meta.url),'utf8')}},settings:{evmVersion:'shanghai',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.deployedBytecode.object']}}}})));
const mock=mockOut.contracts['M.sol'].MockPqcKeyStatus;
const mockAbi=mock.abi,mockRuntime='0x'+mock.evm.deployedBytecode.object;

// Ganache returns the custom-error data on the RPC error (err.data, or inside
// the message); decode it against the production ABI.
function revertOf(err){
 if(typeof err?.data==='string'&&/^0x[0-9a-fA-F]{8}/.test(err.data)) return decodeErrorResult({abi:art.abi,data:err.data});
 const texts=[];let e=err;while(e){texts.push(String(e.details||''),String(e.message||''));e=e.cause;}
 const m=texts.join('\n').match(/revert "?(0x[0-9a-fA-F]+)/);
 if(!m) return null;
 return decodeErrorResult({abi:art.abi,data:m[1]});
}
async function expectRevert(p,name,args){
 let err;try{await p;}catch(e){err=e;}
 assert.ok(err,`expected revert ${name}`);
 const r=revertOf(err);
 assert.equal(r?.errorName,name,String(err.shortMessage||err.message));
 if(args) assert.deepEqual(r.args,args);
}
function pushedValues(hex){
 const b=Buffer.from(hex.slice(2),'hex'),vals=[];
 for(let i=0;i<b.length;i++){const op=b[i];if(op===0xfe)break;if(op>=0x60&&op<=0x7f){const n=op-0x5f;vals.push({n,v:BigInt('0x'+(b.subarray(i+1,i+1+n).toString('hex')||'0'))});i+=n;}}
 return vals;
}

test('V2 production runtime hard-codes pqcKeyStatus 0x...0a02 and has no configurable precompile',()=>{
 const rt=art.deployedRuntimeBytecode;
 assert.ok(rt.includes('0'.repeat(36)+'0a02'),'20-byte literal present in runtime');
 assert.ok(pushedValues(rt).some(p=>p.n===32&&p.v===0xa02n),'PUSH32 of the precompile address');
 assert.deepEqual(art.immutables.PQC_KEY_STATUS.value,PQC);
 assert.equal(art.abi.filter(x=>x.type==='constructor').length,0,'no constructor argument');
 assert.ok(art.abi.every(x=>x.type!=='function'||x.stateMutability!=='payable'),'nothing payable');
 assert.deepEqual(art.abi.filter(x=>x.type==='function').map(x=>x.name).sort(),['ALGORITHM_ML_DSA_87','PQC_KEY_STATUS','getLetter','registerLetter','releaseShareB']);
 const src=fs.readFileSync(new URL('../contracts/FuturePostReleaseV2.sol',import.meta.url),'utf8');
 assert.match(src,/PQC_KEY_STATUS\.staticcall/);
 assert.equal((src.match(/_requireProvenMldsa87\(/g)||[]).length,2,'defined once, called once (registerLetter only)');
 const release=src.slice(src.indexOf('function releaseShareB'),src.indexOf('function getLetter'));
 assert.ok(!release.includes('_requireProvenMldsa87'),'release is not key-guarded');
});

test('actual local EVM: V2 registration requires a proven ML-DSA-87 sender, release stays available',async()=>{
 const g=ganache.provider({logging:{quiet:true},chain:{chainId:9800,hardfork:'shanghai'},wallet:{totalAccounts:3}});
 try{
 const chain={id:9800,name:'LOCAL ONLY - not Diana',nativeCurrency:{name:'Test',symbol:'T',decimals:18},rpcUrls:{default:{http:[]}}};
 const pub=createPublicClient({chain,transport:custom(g)}),w=createWalletClient({chain,transport:custom(g)});
 const [sender,outsider,other]=await w.getAddresses();
 const deployed=await pub.waitForTransactionReceipt({hash:await w.deployContract({account:sender,abi:art.abi,bytecode:art.bytecode,gas:3000000n})});
 assert.equal(deployed.status,'success');
 const address=deployed.contractAddress;
 assert.equal(await pub.getCode({address}),art.deployedRuntimeBytecode,'deployed runtime equals filled artifact');
 assert.equal((await pub.readContract({address,abi:art.abi,functionName:'PQC_KEY_STATUS'})).toLowerCase(),PQC);
 const binding='0x'+'22'.repeat(32),cipher='0x'+'33'.repeat(32),share='0x'+'44'.repeat(32),commitment=keccak256(share);
 const id=n=>'0x'+n.toString(16).padStart(64,'0');
 const now=async()=>(await pub.getBlock()).timestamp;
 // Raw eth_call so Ganache's revert data reaches the decoder unchanged.
 const sim=(name,args,account=sender)=>g.request({method:'eth_call',params:[{from:account,to:address,data:encodeFunctionData({abi:art.abi,functionName:name,args})},'latest']});
 const send=async(name,args,account=sender)=>{const h=await w.writeContract({account,address,abi:art.abi,functionName:name,args,gas:400000n});return pub.waitForTransactionReceipt({hash:h});};
 const mockSend=async(fn,args)=>{const h=await w.writeContract({account:other,address:PQC,abi:mockAbi,functionName:fn,args,gas:200000n});assert.equal((await pub.waitForTransactionReceipt({hash:h})).status,'success');};
 let unlock=(await now())+600n;

 // 1. No code at 0x...0a02 (inactive precompile): fails closed.
 await expectRevert(sim('registerLetter',[id(1),binding,unlock,cipher,commitment]),'PrecompileInactiveOrMalformed');

 // Inject the local mock at the fixed precompile address.
 await g.request({method:'evm_setAccountCode',params:[PQC,mockRuntime]});
 // 2. Unregistered sender.
 await expectRevert(sim('registerLetter',[id(1),binding,unlock,cipher,commitment]),'SenderKeyNotProven',[false,0,false]);
 // 3. Registered ML-DSA-87 but possession not proven.
 await mockSend('set',[sender,true,1,false]);
 await expectRevert(sim('registerLetter',[id(1),binding,unlock,cipher,commitment]),'SenderKeyNotProven',[true,1,false]);
 // 4. Proven key of another algorithm id.
 await mockSend('set',[sender,true,2,true]);
 await expectRevert(sim('registerLetter',[id(1),binding,unlock,cipher,commitment]),'SenderKeyNotProven',[true,2,true]);
 // 5. Malformed / reverting precompile answers fail closed.
 await mockSend('set',[sender,true,1,true]);
 for(const m of [1n,2n,3n,4n]){
  await mockSend('setMode',[m]);
  await expectRevert(sim('registerLetter',[id(1),binding,unlock,cipher,commitment]),'PrecompileInactiveOrMalformed');
 }
 await mockSend('setMode',[0n]);
 // 6. Existing v1 input guards still apply before the key check.
 await expectRevert(sim('registerLetter',[id(1),binding,await now(),cipher,commitment]),'InvalidUnlockTime');
 await expectRevert(sim('registerLetter',[id(1),'0x'+'00'.repeat(32),unlock,cipher,commitment]),'InvalidShare');
 await expectRevert(sim('getLetter',[id(1)]),'LetterMissing');
 // 7. Proven ML-DSA-87 sender registers.
 unlock=(await now())+60n;
 assert.equal((await send('registerLetter',[id(1),binding,unlock,cipher,commitment])).status,'success');
 await expectRevert(sim('registerLetter',[id(1),binding,unlock,cipher,commitment]),'LetterExists');
 // Outsider without a proven key cannot register its own letter.
 await expectRevert(sim('registerLetter',[id(2),binding,unlock,cipher,commitment],outsider),'SenderKeyNotProven',[false,0,false]);
 // 8. Release guards (unchanged from v1).
 await expectRevert(sim('releaseShareB',[id(1),share]),'TooEarly');
 await expectRevert(sim('releaseShareB',[id(1),share],outsider),'NotSender');
 await g.request({method:'evm_increaseTime',params:[61]});await g.request({method:'evm_mine',params:[]});
 await expectRevert(sim('releaseShareB',[id(1),'0x'+'55'.repeat(32)]),'InvalidShare');
 await expectRevert(sim('releaseShareB',[id(1),'0x44']),'InvalidShare');
 // 9. Key removed and precompile gone after registration: release still works.
 await mockSend('set',[sender,false,0,false]);
 await g.request({method:'evm_setAccountCode',params:[PQC,'0x']});
 assert.equal((await send('releaseShareB',[id(1),share])).status,'success');
 await expectRevert(sim('releaseShareB',[id(1),share]),'AlreadyReleased');
 const letter=await pub.readContract({address,abi:art.abi,functionName:'getLetter',args:[id(1)]});
 assert.equal(letter.released,true);assert.equal(letter.sender,sender);assert.equal(letter.unlockAt,unlock);
 assert.equal(letter.ciphertextHash,cipher);assert.equal(letter.shareBCommitment,commitment);
 }finally{await g.disconnect();}
});
