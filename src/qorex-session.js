export const NATIVE_CHAIN='qorechain-diana';
/** Public account discovery only. This adapter exposes no signing method. */
export async function connectDiana(qorex){
 const native=qorex?.native;
 if(!native||typeof native.enable!=='function'||typeof native.getKey!=='function')throw Error('Open this page in the installed QoreX browser/extension context');
 await native.enable(NATIVE_CHAIN);
 const key=await native.getKey(NATIVE_CHAIN);
 if(!/^qor1[0-9a-z]{20,80}$/.test(key?.bech32Address??''))throw Error('No Diana account returned; verify selected network inside QoreX');
 return {chainId:NATIVE_CHAIN,address:key.bech32Address,canHybridBroadcast:Array.isArray(native.capabilities)&&native.capabilities.includes('signAndBroadcast'),status:'CONNECTED_NOT_SIGNED'};
}
export function classifyHybridReceipt(r){
 if(!r||r.code!==0||!Number.isSafeInteger(r.height)||r.height<1||!/^(0x)?[a-fA-F0-9]{64}$/.test(r.txHash??''))return 'UNVERIFIED';
 return r.shield==='shielded'?'WALLET_REPORTED_SHIELDED_NEEDS_CHAIN_READBACK':'UNVERIFIED';
}
