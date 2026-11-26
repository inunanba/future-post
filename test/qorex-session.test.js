import test from 'node:test';import assert from 'node:assert/strict';
import {connectDiana,classifyHybridReceipt} from '../src/qorex-session.js';
test('connect requires native provider, selects only Diana, never calls signer',async()=>{
 const calls=[];const native={capabilities:['signAndBroadcast'],enable:async c=>calls.push(c),getKey:async c=>{calls.push(c);return {bech32Address:'qor1'+'q'.repeat(38)};},signAndBroadcast:()=>assert.fail('must not sign')};
 assert.equal((await connectDiana({native})).status,'CONNECTED_NOT_SIGNED');assert.deepEqual(calls,['qorechain-diana','qorechain-diana']);await assert.rejects(connectDiana({evm:{}}));await assert.rejects(connectDiana({native:{...native,enable:async()=>{throw Error('Rejected');}}}));
});
test('wallet success, EVM success, pending and classical are not hybrid on-chain proof',()=>{
 const r={code:0,height:1,txHash:'ab'.repeat(32),shield:'shielded'};
 assert.equal(classifyHybridReceipt(r),'WALLET_REPORTED_SHIELDED_NEEDS_CHAIN_READBACK');
 for(const change of [{code:1},{height:0},{txHash:'bad'},{shield:'pending'},{shield:'classical'},{shield:'downgraded'}])assert.equal(classifyHybridReceipt({...r,...change}),'UNVERIFIED');
});
