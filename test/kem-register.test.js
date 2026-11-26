import test from 'node:test';import assert from 'node:assert/strict';
import {generateSealKeys} from '@qorechain/qoreseal';
import {buildKemRegistrationPlan} from '../src/native-plan.js';
import {KEM_SIGNER,decodeRegisterKemMessage,executeKemRegistration,validateKemRegistrationPlan} from '../src/kem-register.js';
const makePlan=()=>buildKemRegistrationPlan({address:KEM_SIGNER,mlkemPublicKey:generateSealKeys().mlkemPublicKey});
test('browser KEM guard decodes and binds the public plan',()=>{const p=makePlan(),d=validateKemRegistrationPlan(p);assert.equal(d.address,KEM_SIGNER);assert.equal(d.algorithmId,2);assert.equal(d.publicKey.length,1568);assert.deepEqual(decodeRegisterKemMessage(p.messages[0].value).publicKey,d.publicKey)});
test('browser KEM guard rejects a changed signer, gas, message or nested secret',()=>{const p=makePlan();for(const changed of [{...p,signer:'qor1r274urptm66u0kn6eujalcl0v7sz5tj0tus05t'},{...p,gasLimit:700001},{...p,messages:[...p.messages,p.messages[0]]},{...p,details:{...p.details,secretKey:'x'}}])assert.throws(()=>validateKemRegistrationPlan(changed))});
test('browser KEM executor checks account and calls signAndBroadcast exactly once',async()=>{const p=makePlan(),calls=[];const native={capabilities:['signAndBroadcast'],enable:async c=>calls.push(['enable',c]),getKey:async()=>({bech32Address:KEM_SIGNER}),signAndBroadcast:async r=>{calls.push(['send',r]);return {txHash:'ab'.repeat(32),code:0,height:7,shield:'shielded'}}};const {result}=await executeKemRegistration({native,plan:p});assert.equal(result.code,0);assert.equal(calls.filter(x=>x[0]==='send').length,1);assert.equal(calls[1][1].messages[0].value instanceof Uint8Array,true)});
test('browser KEM executor never broadcasts for wrong account or missing capability',async()=>{
 const p=makePlan(),send=async()=>assert.fail('must not send');
 await assert.rejects(executeKemRegistration({plan:p,native:{capabilities:['signAndBroadcast'],enable:async()=>{},getKey:async()=>({bech32Address:'wrong'}),signAndBroadcast:send}}),/not the reviewed/);
 await assert.rejects(executeKemRegistration({plan:p,native:{capabilities:[],enable:async()=>{},getKey:async()=>({bech32Address:KEM_SIGNER}),signAndBroadcast:send}}),/capability/);
});
