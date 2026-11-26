import fs from 'node:fs/promises';
import solc from 'solc';
const names=['FuturePostRelease','FuturePostReleaseV2'];
// Immutables whose value is fixed in source (no constructor argument). Filling
// them gives the exact runtime code a deployment must have on chain.
const FIXED_IMMUTABLES={FuturePostReleaseV2:{PQC_KEY_STATUS:'0x0000000000000000000000000000000000000a02'}};
const sources={};
for(const n of names) sources[`${n}.sol`]={content:await fs.readFile(new URL(`../contracts/${n}.sol`,import.meta.url),'utf8')};
const input={language:'Solidity',sources,settings:{evmVersion:'shanghai',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences','storageLayout'],'':['ast']}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input)));
if(out.errors?.some(e=>e.severity==='error')) throw Error(out.errors.map(e=>e.formattedMessage).join('\n'));
await fs.mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
function immutableIds(n){
 const ids={};const walk=o=>{if(!o||typeof o!=='object')return;if(o.nodeType==='VariableDeclaration'&&o.mutability==='immutable')ids[o.id]=o.name;for(const v of Object.values(o))walk(v);};
 walk(out.sources[`${n}.sol`].ast);return ids;
}
for(const n of names){
 const c=out.contracts[`${n}.sol`][n];
 const art={compiler:solc.version(),evmVersion:'shanghai',optimizer:{enabled:true,runs:200},abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,runtimeBytecode:'0x'+c.evm.deployedBytecode.object};
 const refs=c.evm.deployedBytecode.immutableReferences||{};
 if(Object.keys(refs).length){
  const ids=immutableIds(n);let code=c.evm.deployedBytecode.object;const filled={};
  for(const [id,places] of Object.entries(refs)){
   const name=ids[id];const value=FIXED_IMMUTABLES[n]?.[name];
   if(!value) throw Error(`${n}: immutable ${name} has no fixed value`);
   const word=value.slice(2).toLowerCase().padStart(64,'0');filled[name]={value,offsets:places.map(p=>p.start)};
   for(const {start,length} of places){if(length!==32)throw Error('unexpected immutable length');code=code.slice(0,start*2)+word+code.slice((start+length)*2);}
  }
  art.immutables=filled;art.deployedRuntimeBytecode='0x'+code;
 }
 await fs.writeFile(new URL(`../artifacts/${n}.json`,import.meta.url),JSON.stringify(art,null,2)+'\n');
}
console.log('Compiled '+names.join(', ')+'; no deployment or network call');
