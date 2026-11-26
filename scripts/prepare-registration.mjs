import fs from 'node:fs/promises';
import { buildDianaPlan } from '../src/diana-plan.js';
import { registrationInputFromBundle } from '../src/public-bundle.js';

try{
  if(process.argv.length!==3)throw new Error('Usage: node scripts/prepare-registration.mjs reviewed-public-registration.json');
  const reviewed=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
  const allowed=['bundle','from','contract','observedBlockTime'];
  if(Object.keys(reviewed).some(k=>!allowed.includes(k)))throw new Error('Unknown fields; use public bundle and public chain values only');
  const input=registrationInputFromBundle(reviewed);
  const artifact=JSON.parse(await fs.readFile(new URL('../artifacts/FuturePostRelease.json',import.meta.url),'utf8'));
  process.stdout.write(JSON.stringify({bundleDigest:reviewed.bundle.bundleDigest,plan:buildDianaPlan(input,artifact)},null,2)+'\n');
}catch(error){console.error('NOT_PREPARED:',error.message);process.exitCode=1;}
