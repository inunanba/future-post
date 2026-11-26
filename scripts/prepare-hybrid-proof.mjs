import fs from 'node:fs/promises';
import {buildKemFingerprintAnchorPlan} from '../src/native-plan.js';
try{
 if(process.argv.length!==3)throw new Error('Usage: node scripts/prepare-hybrid-proof.mjs reviewed-public-kem-fingerprint.json');
 const input=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
 const allowed=['address','publicKeySha256'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))throw new Error('Only address and publicKeySha256 are accepted; never provide a seed, mnemonic, private key or plaintext');
 process.stdout.write(JSON.stringify(buildKemFingerprintAnchorPlan(input),null,2)+'\n');
}catch(error){console.error('NOT_PREPARED:',error.message);process.exitCode=1;}
