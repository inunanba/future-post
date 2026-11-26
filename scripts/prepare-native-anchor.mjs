import fs from 'node:fs/promises';
import { buildLetterAnchorPlan } from '../src/native-plan.js';
try{
 if(process.argv.length!==3)throw new Error('Usage: node scripts/prepare-native-anchor.mjs reviewed-public-anchor.json');
 const input=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
 const allowed=['kind','from','to','bundleDigest','unlockAtUnix','observedChainTime','shareB','shareBCommitment'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))throw new Error('Unknown fields; use public anchor values only');
 process.stdout.write(JSON.stringify(buildLetterAnchorPlan(input),null,2)+'\n');
}catch(error){console.error('NOT_PREPARED:',error.message);process.exitCode=1;}
