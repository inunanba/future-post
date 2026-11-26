import fs from 'node:fs/promises';
import { buildDianaPlan } from '../src/diana-plan.js';
try {
  if(process.argv.length!==3)throw Error('Usage: node scripts/prepare-diana.mjs reviewed-public-input.json');
  const input=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
  const allowed=['chainId','rpc','from','contract','operation','letterId','unlockAt','observedBlockTime','recipientBinding','ciphertextHash','shareBCommitment','shareB'];
  if(Object.keys(input).some(k=>!allowed.includes(k)))throw Error('Unknown fields; never provide credentials, plaintext or keys');
  const artifact=JSON.parse(await fs.readFile(new URL('../artifacts/FuturePostRelease.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(buildDianaPlan(input,artifact),null,2));
}catch(e){console.error('NOT_PREPARED:',e.message);process.exitCode=1;}
