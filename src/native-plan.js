import { buildRegisterKemKeyMessage, fromBase64Url, toBase64Url } from '@qorechain/qoreseal';
import { keccak256 } from 'viem';

export const NATIVE_CHAIN_ID='qorechain-diana';
export const MSG_SEND_TYPE_URL='/cosmos.bank.v1beta1.MsgSend';
const QOR=/^qor1[0-9a-z]{20,80}$/;
const HASH=/^0x[0-9a-fA-F]{64}$/;
const B64URL=/^[A-Za-z0-9_-]+$/;
const SHA256=/^[0-9a-f]{64}$/;

const utf8=value=>new TextEncoder().encode(value);
function concat(...parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
function varint(value){const out=[];let n=value;do{let b=n&127;n=Math.floor(n/128);if(n)b|=128;out.push(b);}while(n);return Uint8Array.from(out);}
function field(number,value){const data=typeof value==='string'?utf8(value):value;return concat(varint(number<<3|2),varint(data.length),data);}
function msgSend({from,to,amountUqor='1'}){if(!QOR.test(from)||!QOR.test(to))throw new TypeError('Valid Diana from/to addresses are required');if(!/^[1-9][0-9]*$/.test(amountUqor))throw new TypeError('Use a positive integer uqor amount');const coin=concat(field(1,'uqor'),field(2,amountUqor));return concat(field(1,from),field(2,to),field(3,coin));}
function publicPlan({kind,signer,messages,memo,gasLimit=400000,details={}}){if(!QOR.test(signer))throw new TypeError('Valid Diana signer required');if(utf8(memo).length>256)throw new TypeError('Memo exceeds QoreX 256-byte limit');return {schema:'future-post-native-plan/v1',kind,chainId:NATIVE_CHAIN_ID,signer,messages:messages.map(m=>({typeUrl:m.typeUrl,value:typeof m.value==='string'?m.value:toBase64Url(m.value)})),memo,gasLimit,details,status:'UNSIGNED_NOT_SENT'};}

export function buildKemRegistrationPlan({address,mlkemPublicKey}){
 const key=typeof mlkemPublicKey==='string'?fromBase64Url(mlkemPublicKey):mlkemPublicKey;
 const message=buildRegisterKemKeyMessage({sender:address,mlkemPublicKey:key});
 return publicPlan({kind:'REGISTER_RECIPIENT_KEM',signer:address,messages:[message],memo:'future-post:v1|register-recipient-kem',gasLimit:700000,details:{algorithm:'ML-KEM-1024',publicKey:toBase64Url(key)}});
}

export function buildKemFingerprintAnchorPlan({address,publicKeySha256}){
 if(!SHA256.test(publicKeySha256))throw new TypeError('Public ML-KEM key fingerprint must be lowercase SHA-256 hex');
 return publicPlan({kind:'ANCHOR_RECIPIENT_KEM_FINGERPRINT',signer:address,messages:[{typeUrl:MSG_SEND_TYPE_URL,value:msgSend({from:address,to:address})}],memo:`future-post:v1|kem-fp|${publicKeySha256}`,gasLimit:300000,details:{recipient:address,amountUqor:'1',denom:'uqor',algorithm:'ML-KEM-1024',publicKeySha256,evidenceBoundary:'FINGERPRINT_COMMITMENT_NOT_KEM_REGISTRATION'}});
}

export function buildLetterAnchorPlan({kind='prepare',from,to,bundleDigest,unlockAtUnix,observedChainTime,shareB,shareBCommitment}){
 if(kind!=='prepare'&&kind!=='release')throw new TypeError('Anchor kind must be prepare or release');
 if(!HASH.test(bundleDigest)||!Number.isSafeInteger(unlockAtUnix)||unlockAtUnix<1)throw new TypeError('Valid bundle digest and unlock time required');
 let memo;
 if(kind==='prepare'){
  if(!HASH.test(shareBCommitment))throw new TypeError('Valid share B commitment required');
  memo=`future-post:v1|prepare|${bundleDigest.slice(2)}|${unlockAtUnix}|${shareBCommitment.slice(2)}`;
 }else{
  if(typeof shareB!=='string'||!B64URL.test(shareB)||shareB.length!==43)throw new TypeError('Release needs a 32-byte base64url share B');
  if(!Number.isSafeInteger(observedChainTime)||observedChainTime<unlockAtUnix)throw new Error('Release requires observed chain time at or after unlock');
  if(!HASH.test(shareBCommitment)||keccak256(fromBase64Url(shareB)).toLowerCase()!==shareBCommitment.toLowerCase())throw new Error('Release share B does not match its commitment');
  memo=`future-post:v1|release|${bundleDigest.slice(2)}|${shareB}`;
 }
 return publicPlan({kind:`LETTER_${kind.toUpperCase()}_ANCHOR`,signer:from,messages:[{typeUrl:MSG_SEND_TYPE_URL,value:msgSend({from,to})}],memo,gasLimit:300000,details:{recipient:to,amountUqor:'1',bundleDigest,unlockAtUnix,shareBCommitment}});
}

function assertNoPrivateFields(value,path='plan'){
 if(!value||typeof value!=='object')return;
 for(const [key,child] of Object.entries(value)){
  if(/^(seed|mnemonic|privateKey|secretKey|shareA|shareB)$/i.test(key))throw new Error(`Forbidden private field: ${path}.${key}`);
  assertNoPrivateFields(child,`${path}.${key}`);
 }
}

export function validateNativePlan(plan){
 if(!plan||plan.schema!=='future-post-native-plan/v1'||plan.chainId!==NATIVE_CHAIN_ID||!QOR.test(plan.signer)||!Array.isArray(plan.messages)||plan.messages.length<1||plan.messages.length>32)throw new TypeError('Invalid Diana native plan');
 if(plan.status!=='UNSIGNED_NOT_SENT'||utf8(plan.memo??'').length>256||!Number.isSafeInteger(plan.gasLimit)||plan.gasLimit<100000||plan.gasLimit>5000000)throw new TypeError('Invalid plan limits');
 for(const m of plan.messages){if(typeof m.typeUrl!=='string'||!m.typeUrl.startsWith('/')||typeof m.value!=='string'||!B64URL.test(m.value))throw new TypeError('Invalid encoded message');}
 assertNoPrivateFields(plan);
 return plan;
}

export async function executeNativePlan({native,plan}){
 validateNativePlan(plan);
 if(!native||!Array.isArray(native.capabilities)||!native.capabilities.includes('signAndBroadcast')||typeof native.signAndBroadcast!=='function')throw new Error('QoreX signAndBroadcast capability is required');
 await native.enable(NATIVE_CHAIN_ID);
 const key=await native.getKey(NATIVE_CHAIN_ID);
 if(key?.bech32Address!==plan.signer)throw new Error('Active QoreX account does not match the reviewed signer');
 const request={chainId:NATIVE_CHAIN_ID,messages:plan.messages.map(m=>({typeUrl:m.typeUrl,value:fromBase64Url(m.value)})),memo:plan.memo,gasLimit:plan.gasLimit};
 return native.signAndBroadcast(request);
}
