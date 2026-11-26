import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ganache from 'ganache';
import { createPublicClient,createWalletClient,custom,keccak256 } from 'viem';
const art=JSON.parse(fs.readFileSync(new URL('../artifacts/FuturePostRelease.json',import.meta.url)));
test('actual local EVM: sender/date/commitment/duplicate guards and immutable metadata',async()=>{
 const g=ganache.provider({logging:{quiet:true},chain:{chainId:9800,hardfork:'shanghai'},wallet:{totalAccounts:2}});
 try{
 const chain={id:9800,name:'LOCAL ONLY - not Diana',nativeCurrency:{name:'Test',symbol:'T',decimals:18},rpcUrls:{default:{http:[]}}};
 const pub=createPublicClient({chain,transport:custom(g)}), w=createWalletClient({chain,transport:custom(g)});
 const [sender,outsider]=await w.getAddresses();
 const deployed=await pub.waitForTransactionReceipt({hash:await w.deployContract({account:sender,abi:art.abi,bytecode:art.bytecode,gas:3000000n})});
 assert.equal(deployed.status,'success');
 const address=deployed.contractAddress;
 const id='0x'+'11'.repeat(32),binding='0x'+'22'.repeat(32),cipher='0x'+'33'.repeat(32),share='0x'+'44'.repeat(32),commitment=keccak256(share);
 const now=(await pub.getBlock()).timestamp,unlock=now+60n;
 const simulate=(name,args,account=sender)=>pub.simulateContract({address,abi:art.abi,functionName:name,args,account});
 await assert.rejects(simulate('getLetter',[id]));
 await assert.rejects(simulate('registerLetter',[id,binding,now,cipher,commitment]));
 let hash=await w.writeContract({account:sender,address,abi:art.abi,functionName:'registerLetter',args:[id,binding,unlock,cipher,commitment],gas:300000n});
 assert.equal((await pub.waitForTransactionReceipt({hash})).status,'success');
 await assert.rejects(simulate('registerLetter',[id,binding,unlock,cipher,commitment]));
 await assert.rejects(simulate('releaseShareB',[id,share]));
 await assert.rejects(simulate('releaseShareB',[id,share],outsider));
 await g.request({method:'evm_increaseTime',params:[61]});await g.request({method:'evm_mine',params:[]});
 await assert.rejects(simulate('releaseShareB',[id,'0x'+'55'.repeat(32)]));
 await assert.rejects(simulate('releaseShareB',[id,'0x44']));
 hash=await w.writeContract({account:sender,address,abi:art.abi,functionName:'releaseShareB',args:[id,share],gas:150000n});
 assert.equal((await pub.waitForTransactionReceipt({hash})).status,'success');
 await assert.rejects(simulate('releaseShareB',[id,share]));
 const letter=await pub.readContract({address,abi:art.abi,functionName:'getLetter',args:[id]});
 assert.equal(letter.released,true);assert.equal(letter.unlockAt,unlock);assert.equal(letter.ciphertextHash,cipher);assert.equal(letter.shareBCommitment,commitment);
 }finally{await g.disconnect();}
});
