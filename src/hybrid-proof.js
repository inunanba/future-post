export const HYBRID_CHAIN_ID='qorechain-diana';
export const HYBRID_SIGNER='qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52';
export const HYBRID_TYPE_URL='/cosmos.bank.v1beta1.MsgSend';
export const HYBRID_GAS_LIMIT=300000;
export const REVIEWED_KEM_FINGERPRINT='3f6cffdb4cd083ae855a3f5cc074eac70fa92b7c4fc8b565d95e520a80c6a358';
export const HYBRID_MEMO=`future-post:v1|kem-fp|${REVIEWED_KEM_FINGERPRINT}`;

const B64URL=/^[A-Za-z0-9_-]+$/;
const FORBIDDEN=/^(seed|mnemonic|privateKey|secretKey|shareA|shareB|password|plaintext)$/i;

export function fromBase64Url(value){
 if(typeof value!=='string'||!B64URL.test(value))throw new TypeError('Message value must be unpadded base64url');
 const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
 const raw=globalThis.atob?globalThis.atob(padded):Buffer.from(padded,'base64').toString('binary');
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}

function rejectPrivateFields(value,path='plan'){
 if(!value||typeof value!=='object')return;
 for(const [key,child] of Object.entries(value)){if(FORBIDDEN.test(key))throw new Error(`Private field is forbidden: ${path}.${key}`);rejectPrivateFields(child,`${path}.${key}`);}
}

function readVarint(bytes,state){let value=0,shift=0;while(state.i<bytes.length&&shift<=49){const b=bytes[state.i++];value+=(b&127)*2**shift;if(!(b&128))return value;shift+=7;}throw new Error('Malformed protobuf varint');}
function readField(bytes,state,number,wire=2){const tag=readVarint(bytes,state);if(tag!==(number<<3|wire))throw new Error(`Unexpected protobuf field; expected ${number}/${wire}`);const length=readVarint(bytes,state),end=state.i+length;if(length<0||end>bytes.length)throw new Error('Malformed protobuf length');const value=bytes.slice(state.i,end);state.i=end;return value;}
const text=bytes=>new TextDecoder().decode(bytes);

export function decodeMsgSend(value){
 const bytes=typeof value==='string'?fromBase64Url(value):value,state={i:0};
 const from=text(readField(bytes,state,1));
 const to=text(readField(bytes,state,2));
 const coinBytes=readField(bytes,state,3),coinState={i:0};
 const denom=text(readField(coinBytes,coinState,1));
 const amount=text(readField(coinBytes,coinState,2));
 if(state.i!==bytes.length||coinState.i!==coinBytes.length)throw new Error('Unexpected protobuf fields in MsgSend');
 return {from,to,denom,amount};
}

export function validateHybridProofPlan(plan){
 rejectPrivateFields(plan);
 if(!plan||plan.schema!=='future-post-native-plan/v1'||plan.kind!=='ANCHOR_RECIPIENT_KEM_FINGERPRINT'||plan.chainId!==HYBRID_CHAIN_ID||plan.signer!==HYBRID_SIGNER||plan.status!=='UNSIGNED_NOT_SENT')throw new Error('Plan identity, network, signer or status is not the reviewed fingerprint anchor');
 if(plan.memo!==HYBRID_MEMO||plan.gasLimit!==HYBRID_GAS_LIMIT)throw new Error('Memo or gas does not match the reviewed fingerprint anchor');
 if(!Array.isArray(plan.messages)||plan.messages.length!==1||plan.messages[0]?.typeUrl!==HYBRID_TYPE_URL)throw new Error('Exactly one MsgSend message is required');
 const decoded=decodeMsgSend(plan.messages[0].value);
 if(decoded.from!==HYBRID_SIGNER||decoded.to!==HYBRID_SIGNER||decoded.denom!=='uqor'||decoded.amount!=='1')throw new Error('MsgSend must be the reviewed 1 uqor self-transfer');
 const d=plan.details;
 if(d?.recipient!==HYBRID_SIGNER||d?.amountUqor!=='1'||d?.denom!=='uqor'||d?.algorithm!=='ML-KEM-1024'||d?.publicKeySha256!==REVIEWED_KEM_FINGERPRINT||d?.evidenceBoundary!=='FINGERPRINT_COMMITMENT_NOT_KEM_REGISTRATION')throw new Error('Plan details do not preserve the reviewed evidence boundary');
 return {...decoded,plan};
}

export async function executeHybridProof({native,plan,onState=()=>{}}){
 validateHybridProofPlan(plan);
 if(!native||!Array.isArray(native.capabilities)||!native.capabilities.includes('signAndBroadcast')||typeof native.enable!=='function'||typeof native.getKey!=='function'||typeof native.signAndBroadcast!=='function')throw new Error('QoreX Native signAndBroadcast capability is required');
 onState('CONNECTING_DIANA');await native.enable(HYBRID_CHAIN_ID);
 const key=await native.getKey(HYBRID_CHAIN_ID);if(key?.bech32Address!==HYBRID_SIGNER)throw new Error('Active QoreX account is not the reviewed Account 1 signer');
 onState('WALLET_SIGNATURE_REQUESTED');
 return native.signAndBroadcast({chainId:HYBRID_CHAIN_ID,messages:[{typeUrl:HYBRID_TYPE_URL,value:fromBase64Url(plan.messages[0].value)}],memo:HYBRID_MEMO,gasLimit:HYBRID_GAS_LIMIT});
}
