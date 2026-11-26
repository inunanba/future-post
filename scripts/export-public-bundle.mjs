import fs from 'node:fs/promises';
import { createPublicBundle, validatePublicBundle } from '../src/public-bundle.js';

try{
  if(process.argv.length!==3)throw new Error('Usage: node scripts/export-public-bundle.mjs private-local-input.json');
  const input=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
  const allowed=['id','context','sealedShareA','iv','ciphertext','shareB'];
  if(Object.keys(input).some(k=>!allowed.includes(k)))throw new Error('Unknown fields; do not provide plaintext, credentials, keys or wallet secrets');
  const decode=value=>Uint8Array.from(Buffer.from(value,'base64url'));
  const bundle=createPublicBundle({id:input.id,context:input.context,sealedShareA:input.sealedShareA,sealed:{iv:decode(input.iv),ciphertext:decode(input.ciphertext),shareB:decode(input.shareB)}});
  validatePublicBundle(bundle);
  process.stdout.write(JSON.stringify(bundle,null,2)+'\n');
}catch(error){console.error('NOT_EXPORTED:',error.message);process.exitCode=1;}
