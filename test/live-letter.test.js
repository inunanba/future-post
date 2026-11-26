import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { keccak256, toHex } from 'viem';
import { validatePublicBundle } from '../src/public-bundle.js';

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
test('committed live-letter bundle is a valid public bundle with no private fields',()=>{
 const bundle=read('../evidence/live-letter-bundle.json'),ev=read('../evidence/diana-live-letter.json');
 const v=validatePublicBundle(bundle);
 assert.equal(v.status,'PUBLIC_BUNDLE_VERIFIED');
 assert.equal(bundle.registration.letterId,keccak256(toHex(bundle.purpose)));
 assert.equal(ev.letter_id,bundle.registration.letterId);
 assert.equal(ev.bundle_digest,bundle.bundleDigest);
 assert.equal(ev.register.status,'success');assert.equal(ev.release.status,'success');
 assert.ok(ev.release.block>ev.register.block);
 assert.ok(Date.parse(ev.release.block_time_utc)>=Date.parse(ev.unlock_at_utc)-1000);
 assert.equal(keccak256(ev.release.share_b_released),bundle.registration.shareBCommitment);
 assert.equal(ev.open_after_release.plaintext_matches,true);
});
