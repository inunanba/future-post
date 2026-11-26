import fs from 'node:fs/promises';
import solc from 'solc';
const input={language:'Solidity',sources:{'FuturePostRelease.sol':{content:await fs.readFile(new URL('../contracts/FuturePostRelease.sol',import.meta.url),'utf8')}},settings:{evmVersion:'shanghai',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input)));
if(out.errors?.some(e=>e.severity==='error')) throw Error(out.errors.map(e=>e.formattedMessage).join('\n'));
const c=out.contracts['FuturePostRelease.sol'].FuturePostRelease;
await fs.mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../artifacts/FuturePostRelease.json',import.meta.url),JSON.stringify({compiler:solc.version(),evmVersion:'shanghai',optimizer:{enabled:true,runs:200},abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,runtimeBytecode:'0x'+c.evm.deployedBytecode.object},null,2)+'\n');
console.log('Compiled FuturePostRelease; no deployment or network call');
