import { encodeFunctionData, isAddress, keccak256 } from 'viem';

export const EVM_CHAIN_ID=9800;
export const DIANA_RPC='https://evm-testnet.qore.host';
const hash=/^0x[0-9a-fA-F]{64}$/;
function bytes32(value,name){if(!hash.test(value)||/^0x0+$/.test(value))throw Error('Invalid '+name);return value;}
function address(value){if(!isAddress(value)||/^0x0+$/.test(value))throw Error('Invalid address');return value;}
function seconds(value){if(!Number.isSafeInteger(value)||value<1)throw Error('Use positive integer Unix seconds');return BigInt(value);}

/** Unsigned only. Does not read keys, send RPC, sign or broadcast. */
export function buildDianaPlan(input,artifact){
  if(input.chainId!==EVM_CHAIN_ID||input.rpc!==DIANA_RPC)throw Error('DIANA_ONLY: require exact chain 9800 and testnet RPC');
  const from=address(input.from), tx={chainId:EVM_CHAIN_ID,from,value:'0x0'};
  if(input.operation==='deploy'){
    if(!/^0x[0-9a-f]+$/i.test(artifact.bytecode))throw Error('Missing compiled bytecode');
    tx.data=artifact.bytecode;
  }else{
    tx.to=address(input.contract);
    bytes32(input.letterId,'letterId');
    if(input.operation==='register'){
      const unlock=seconds(input.unlockAt),now=seconds(input.observedBlockTime);
      if(unlock<=now)throw Error('Opening must follow observed chain time');
      tx.data=encodeFunctionData({abi:artifact.abi,functionName:'registerLetter',args:[input.letterId,bytes32(input.recipientBinding,'recipientBinding'),unlock,bytes32(input.ciphertextHash,'ciphertextHash'),bytes32(input.shareBCommitment,'shareBCommitment')]});
    }else if(input.operation==='release'){
      if(seconds(input.observedBlockTime)<seconds(input.unlockAt))throw Error('TOO_EARLY');
      if(!hash.test(input.shareB)||keccak256(input.shareB)!==input.shareBCommitment)throw Error('Share B commitment mismatch');
      tx.data=encodeFunctionData({abi:artifact.abi,functionName:'releaseShareB',args:[input.letterId,input.shareB]});
    }else throw Error('Unsupported operation');
  }
  return {status:'UNSIGNED_NOT_SENT',operation:input.operation,transaction:tx,warning:'The operator must independently check current chain, account, window, simulation, nonce and approval before signing. EVM success alone is not native hybrid-signature evidence.'};
}
