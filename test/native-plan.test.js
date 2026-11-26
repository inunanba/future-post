import test from 'node:test';import assert from 'node:assert/strict';
import { generateSealKeys, toBase64Url } from '@qorechain/qoreseal';
import { keccak256 } from 'viem';
import { buildKemFingerprintAnchorPlan,buildKemRegistrationPlan,buildLetterAnchorPlan,executeNativePlan,validateNativePlan } from '../src/native-plan.js';
const recipient='qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52',sender='qor1r274urptm66u0kn6eujalcl0v7sz5tj0tus05t',digest='0x'+'11'.repeat(32),shareB='A'.repeat(43),commitment=keccak256(new Uint8Array(32));
test('builds a public KEM registration plan without recipient secrets',()=>{
 const keys=generateSealKeys();const plan=buildKemRegistrationPlan({address:recipient,mlkemPublicKey:keys.mlkemPublicKey});
 assert.equal(plan.messages[0].typeUrl,'/qorechain.pqc.v1.MsgRegisterKEMKey');assert.equal(plan.details.publicKey,toBase64Url(keys.mlkemPublicKey));
 for(const f of ['seed','mnemonic','privateKey','secretKey','shareA','shareB'])assert.equal(f in plan,false);
 assert.equal(validateNativePlan(plan),plan);
});
test('builds 1 uqor prepare and release anchors under the memo limit',()=>{
 const prepare=buildLetterAnchorPlan({from:sender,to:recipient,bundleDigest:digest,unlockAtUnix:200,shareBCommitment:commitment});
 const release=buildLetterAnchorPlan({kind:'release',from:sender,to:recipient,bundleDigest:digest,unlockAtUnix:200,observedChainTime:200,shareB,shareBCommitment:commitment});
 assert.equal(prepare.details.amountUqor,'1');assert.equal(prepare.messages[0].typeUrl,'/cosmos.bank.v1beta1.MsgSend');assert.ok(new TextEncoder().encode(release.memo).length<=256);
});
test('builds a public KEM fingerprint commitment without claiming registration',()=>{const fingerprint='ab'.repeat(32),plan=buildKemFingerprintAnchorPlan({address:recipient,publicKeySha256:fingerprint});assert.equal(plan.kind,'ANCHOR_RECIPIENT_KEM_FINGERPRINT');assert.equal(plan.memo,`future-post:v1|kem-fp|${fingerprint}`);assert.equal(plan.details.evidenceBoundary,'FINGERPRINT_COMMITMENT_NOT_KEM_REGISTRATION');assert.equal(validateNativePlan(plan),plan);assert.throws(()=>buildKemFingerprintAnchorPlan({address:recipient,publicKeySha256:'bad'}))});
test('requires exact active signer before calling QoreX once',async()=>{
 const plan=buildLetterAnchorPlan({from:sender,to:recipient,bundleDigest:digest,unlockAtUnix:200,shareBCommitment:commitment});const calls=[];
 const native={capabilities:['signAndBroadcast'],enable:async c=>calls.push(['enable',c]),getKey:async()=>({bech32Address:sender}),signAndBroadcast:async r=>{calls.push(['send',r]);return {txHash:'ab'.repeat(32),code:0,height:1,shield:'shielded'};}};
 const result=await executeNativePlan({native,plan});assert.equal(result.code,0);assert.equal(calls.filter(x=>x[0]==='send').length,1);assert.equal(calls[1][1].messages[0].value instanceof Uint8Array,true);
});
test('refuses mismatched account, absent capability, invalid digest and malformed release',async()=>{
 const plan=buildLetterAnchorPlan({from:sender,to:recipient,bundleDigest:digest,unlockAtUnix:200,shareBCommitment:commitment});
 await assert.rejects(executeNativePlan({native:{capabilities:['signAndBroadcast'],enable:async()=>{},getKey:async()=>({bech32Address:recipient}),signAndBroadcast:async()=>assert.fail()},plan}),/does not match/);
 await assert.rejects(executeNativePlan({native:{capabilities:[]},plan}),/capability/);
 assert.throws(()=>buildLetterAnchorPlan({from:sender,to:recipient,bundleDigest:'bad',unlockAtUnix:200,shareBCommitment:commitment}));
 assert.throws(()=>buildLetterAnchorPlan({kind:'release',from:sender,to:recipient,bundleDigest:digest,unlockAtUnix:200,shareB:'bad'}));
 assert.throws(()=>buildLetterAnchorPlan({kind:'release',from:sender,to:recipient,bundleDigest:digest,unlockAtUnix:200,observedChainTime:199,shareB,shareBCommitment:commitment}),/observed chain time/);
 assert.throws(()=>validateNativePlan({...plan,details:{...plan.details,secretKey:'nope'}}),/Forbidden private field/);
});
