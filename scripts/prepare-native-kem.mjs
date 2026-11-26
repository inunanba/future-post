import fs from 'node:fs/promises';
import { buildKemRegistrationPlan } from '../src/native-plan.js';
try{
 if(process.argv.length!==3)throw new Error('Usage: node scripts/prepare-native-kem.mjs reviewed-public-recipient-kem.json');
 const input=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
 const allowed=['address','mlkemPublicKey'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))throw new Error('Only address and public ML-KEM key are accepted; never provide a seed, mnemonic or secret key');
 process.stdout.write(JSON.stringify(buildKemRegistrationPlan(input),null,2)+'\n');
}catch(error){console.error('NOT_PREPARED:',error.message);process.exitCode=1;}
