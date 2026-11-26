import test from 'node:test';import assert from 'node:assert/strict';
import {classifyEvmProgress,receiptDisplayText} from '../src/receipt-state.js';
const hash='ab'.repeat(32);
test('keeps request, broadcast, pending and confirmed evidence distinct',()=>{
 assert.equal(classifyEvmProgress().code,'PLANNED');
 assert.equal(classifyEvmProgress({stage:'signature-requested'}).code,'WALLET_SIGNATURE_REQUESTED');
 assert.equal(classifyEvmProgress({txHash:hash}).code,'BROADCAST_UNKNOWN');
 assert.equal(classifyEvmProgress({txHash:hash,receipt:{status:'pending'}}).code,'TX_PENDING');
 assert.equal(classifyEvmProgress({txHash:hash,receipt:{status:'success',blockNumber:1}}).code,'CONFIRMED_SUCCESS');
 assert.equal(classifyEvmProgress({txHash:hash,receipt:{status:'reverted',blockNumber:1}}).code,'CONFIRMED_REVERT');
});
test('does not turn malformed evidence into success',()=>{assert.equal(classifyEvmProgress({txHash:'bad',receipt:{status:'success',blockNumber:1}}).code,'PLANNED');assert.match(receiptDisplayText({stage:'unknown'}),/^UNKNOWN/);});
