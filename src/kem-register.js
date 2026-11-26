export const KEM_CHAIN_ID='qorechain-diana';
export const KEM_SIGNER='qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52';
export const KEM_TYPE_URL='/qorechain.pqc.v1.MsgRegisterKEMKey';
export const KEM_MEMO='future-post:v1|register-recipient-kem';
export const KEM_GAS_LIMIT=700000;

const B64URL=/^[A-Za-z0-9_-]+$/;
const FORBIDDEN=/^(seed|mnemonic|privateKey|secretKey|shareA|shareB|password)$/i;

export function fromBase64Url(value){
 if(typeof value!=='string'||!B64URL.test(value))throw new TypeError('Message value must be unpadded base64url');
 const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
 const raw=globalThis.atob?globalThis.atob(padded):Buffer.from(padded,'base64').toString('binary');
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}

export function toBase64Url(bytes){
 let raw='';for(const byte of bytes)raw+=String.fromCharCode(byte);
 const encoded=globalThis.btoa?globalThis.btoa(raw):Buffer.from(raw,'binary').toString('base64');
 return encoded.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function rejectPrivateFields(value,path='plan'){
 if(!value||typeof value!=='object')return;
 for(const [key,child] of Object.entries(value)){
  if(FORBIDDEN.test(key))throw new Error(`Private field is forbidden: ${path}.${key}`);
  rejectPrivateFields(child,`${path}.${key}`);
 }
}

function readVarint(bytes,state){
 let value=0,shift=0;
 while(state.i<bytes.length&&shift<=49){const b=bytes[state.i++];value+=(b&127)*2**shift;if(!(b&128))return value;shift+=7;}
 throw new Error('Malformed protobuf varint');
}

function readField(bytes,state,number,wire){
 const tag=readVarint(bytes,state);
 if(tag!==(number<<3|wire))throw new Error(`Unexpected protobuf field; expected ${number}/${wire}`);
 if(wire===0)return readVarint(bytes,state);
 const length=readVarint(bytes,state),end=state.i+length;
 if(length<0||end>bytes.length)throw new Error('Malformed protobuf length');
 const value=bytes.slice(state.i,end);state.i=end;return value;
}

export function decodeRegisterKemMessage(value){
 const bytes=typeof value==='string'?fromBase64Url(value):value,state={i:0};
 const address=new TextDecoder().decode(readField(bytes,state,1,2));
 const algorithmId=readField(bytes,state,2,0);
 const publicKey=readField(bytes,state,3,2);
 if(state.i!==bytes.length)throw new Error('Unexpected protobuf fields after public key');
 return {address,algorithmId,publicKey};
}

export function validateKemRegistrationPlan(plan){
 rejectPrivateFields(plan);
 if(!plan||plan.schema!=='future-post-native-plan/v1'||plan.kind!=='REGISTER_RECIPIENT_KEM'||plan.chainId!==KEM_CHAIN_ID||plan.signer!==KEM_SIGNER||plan.status!=='UNSIGNED_NOT_SENT')throw new Error('Plan identity, network, signer or status is not the reviewed KEM operation');
 if(plan.memo!==KEM_MEMO||plan.gasLimit!==KEM_GAS_LIMIT)throw new Error('Memo or gas does not match the reviewed KEM operation');
 if(!Array.isArray(plan.messages)||plan.messages.length!==1||plan.messages[0]?.typeUrl!==KEM_TYPE_URL)throw new Error('Exactly one MsgRegisterKEMKey message is required');
 const decoded=decodeRegisterKemMessage(plan.messages[0].value);
 if(decoded.address!==KEM_SIGNER||decoded.algorithmId!==2||decoded.publicKey.length!==1568)throw new Error('Encoded KEM sender, algorithm or public-key length is invalid');
 if(plan.details?.algorithm!=='ML-KEM-1024'||plan.details?.publicKey!==toBase64Url(decoded.publicKey))throw new Error('Public KEM details do not match the encoded message');
 return {...decoded,plan};
}

export async function executeKemRegistration({native,plan,onState=()=>{}}){
 const checked=validateKemRegistrationPlan(plan);
 if(!native||!Array.isArray(native.capabilities)||!native.capabilities.includes('signAndBroadcast')||typeof native.enable!=='function'||typeof native.getKey!=='function'||typeof native.signAndBroadcast!=='function')throw new Error('QoreX Native signAndBroadcast capability is required');
 onState('CONNECTING_Diana');
 await native.enable(KEM_CHAIN_ID);
 const key=await native.getKey(KEM_CHAIN_ID);
 if(key?.bech32Address!==KEM_SIGNER)throw new Error('Active QoreX account is not the reviewed coin-118 signer');
 onState('WALLET_SIGNATURE_REQUESTED');
 const result=await native.signAndBroadcast({chainId:KEM_CHAIN_ID,messages:[{typeUrl:KEM_TYPE_URL,value:fromBase64Url(plan.messages[0].value)}],memo:KEM_MEMO,gasLimit:KEM_GAS_LIMIT});
 return {result,publicKey:checked.publicKey};
}

export async function publicKeyFingerprint(bytes){
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
