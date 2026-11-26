import test from 'node:test';
import assert from 'node:assert/strict';
import { keccak256 } from 'viem';
import { createPublicBundle, registrationInputFromBundle, validatePublicBundle } from '../src/public-bundle.js';

const id='letter_123456';
const recipient='qor1'+'q'.repeat(38);
const unlockAt='2026-12-01T00:00:00.000Z';
const context={chainId:'qorechain-diana',purpose:`future-post:v1:${id}`,associatedData:JSON.stringify({version:1,id,unlockAt,recipient})};
const sealed={iv:Uint8Array.from({length:12},(_,i)=>i),ciphertext:Uint8Array.from({length:48},(_,i)=>i+1),shareB:Uint8Array.from({length:32},(_,i)=>255-i)};

test('exports a recipient handoff with no plaintext or key shares',()=>{
 const b=createPublicBundle({id,context,sealedShareA:'qoreseal:v1:recipient-only-envelope',sealed});
 assert.equal(validatePublicBundle(b).status,'PUBLIC_BUNDLE_VERIFIED');
 for(const field of ['plaintext','shareA','shareB','contentKey'])assert.equal(field in b,false);
 assert.equal(b.registration.shareBCommitment,keccak256(sealed.shareB));
});

test('rejects a changed ciphertext, recipient context or digest',()=>{
 const original=createPublicBundle({id,context,sealedShareA:'qoreseal:v1:recipient-only-envelope',sealed});
 for(const mutate of [
  b=>{b.ciphertext=b.ciphertext.slice(0,-1)+'A';},
  b=>{b.recipient='qor1'+'p'.repeat(38);},
  b=>{b.bundleDigest='0x'+'00'.repeat(32);}
 ]){const changed=structuredClone(original);mutate(changed);assert.throws(()=>validatePublicBundle(changed));}
});

test('derives the unsigned registration only from verified bundle fields',()=>{
 const bundle=createPublicBundle({id,context,sealedShareA:'qoreseal:v1:recipient-only-envelope',sealed});
 const input=registrationInputFromBundle({bundle,from:'0x'+'11'.repeat(20),contract:'0x'+'22'.repeat(20),observedBlockTime:100});
 assert.equal(input.operation,'register');assert.equal(input.chainId,9800);assert.equal(input.unlockAt,1796083200);assert.equal(input.ciphertextHash,bundle.registration.ciphertextHash);
});
