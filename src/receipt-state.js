const HASH=/^(0x)?[0-9a-fA-F]{64}$/;
export function classifyEvmProgress({stage='planned',txHash,receipt}={}){
 if(stage==='unsupported')return {code:'UNSUPPORTED',final:true,label:'This wallet route is not supported.'};
 if(stage==='unknown')return {code:'UNKNOWN',final:false,label:'The result is unknown; do not retry automatically.'};
 if(receipt?.status==='success'&&receipt.blockNumber!=null&&HASH.test(txHash??''))return {code:'CONFIRMED_SUCCESS',final:true,label:'Chain receipt confirms success.'};
 if((receipt?.status==='reverted'||receipt?.status==='failed')&&receipt.blockNumber!=null&&HASH.test(txHash??''))return {code:'CONFIRMED_REVERT',final:true,label:'Chain receipt confirms a revert.'};
 if(receipt?.status==='pending'&&HASH.test(txHash??''))return {code:'TX_PENDING',final:false,label:'Transaction is pending chain confirmation.'};
 if(HASH.test(txHash??''))return {code:'BROADCAST_UNKNOWN',final:false,label:'A hash exists, but chain inclusion is not confirmed.'};
 if(stage==='signature-requested')return {code:'WALLET_SIGNATURE_REQUESTED',final:false,label:'The wallet request is open; this is not a signature or broadcast receipt.'};
 return {code:'PLANNED',final:false,label:'Unsigned plan only; nothing has been sent.'};
}
export function receiptDisplayText(progress){
 const state=classifyEvmProgress(progress);
 return `${state.code} — ${state.label}`;
}
