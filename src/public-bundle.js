import { isAddress, keccak256, toHex } from 'viem';

const B64URL=/^[A-Za-z0-9_-]+$/;
const HASH=/^0x[0-9a-f]{64}$/;
const QOR=/^qor1[0-9a-z]{20,80}$/;

function bytes(value,label,length){
  if(!(value instanceof Uint8Array)||value.length!==length)throw new TypeError(`${label} must be ${length} bytes`);
  return value;
}
function b64url(value){
  let binary='';
  for(const byte of value)binary+=String.fromCharCode(byte);
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/u,'');
}
function fromB64url(value,label){
  if(typeof value!=='string'||!B64URL.test(value))throw new TypeError(`Invalid ${label}`);
  const padded=value.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-value.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
function digest(value){return keccak256(toHex(JSON.stringify(canonical(value))));}
function assertContext(context,id){
  if(context?.chainId!=='qorechain-diana'||typeof context.purpose!=='string')throw new TypeError('Diana envelope context required');
  const aad=JSON.parse(context.associatedData);
  if(aad.version!==1||aad.id!==id||!QOR.test(aad.recipient)||!Number.isFinite(Date.parse(aad.unlockAt)))throw new TypeError('Associated data does not match the letter');
  if(context.purpose!==`future-post:v1:${id}`)throw new TypeError('Purpose does not match the letter');
  return aad;
}

export function createPublicBundle({id,context,sealedShareA,sealed}){
  if(!/^[a-zA-Z0-9_-]{6,80}$/.test(id))throw new TypeError('Letter id is invalid');
  const aad=assertContext(context,id);
  if(typeof sealedShareA!=='string'||sealedShareA.length<16)throw new TypeError('A recipient-sealed share A envelope is required');
  bytes(sealed.iv,'iv',12);bytes(sealed.ciphertext,'ciphertext',sealed.ciphertext?.length);bytes(sealed.shareB,'share B',32);
  if(sealed.ciphertext.length<17)throw new TypeError('Ciphertext is too short');
  const payload={
    schema:'future-post-public-bundle/v1',
    chainId:'qorechain-diana',
    letterId:id,
    purpose:context.purpose,
    unlockAt:aad.unlockAt,
    recipient:aad.recipient,
    associatedData:context.associatedData,
    algorithm:'AES-256-GCM',
    iv:b64url(sealed.iv),
    ciphertext:b64url(sealed.ciphertext),
    sealedShareA,
    registration:{
      letterId:keccak256(toHex(context.purpose)),
      recipientBinding:keccak256(toHex(`${context.chainId}:${aad.recipient}`)),
      ciphertextHash:keccak256(sealed.ciphertext),
      shareBCommitment:keccak256(sealed.shareB)
    }
  };
  return {...payload,bundleDigest:digest(payload)};
}

export function validatePublicBundle(bundle){
  if(!bundle||bundle.schema!=='future-post-public-bundle/v1'||bundle.chainId!=='qorechain-diana')throw new TypeError('Unsupported public bundle');
  const payload={...bundle};delete payload.bundleDigest;
  if(!HASH.test(bundle.bundleDigest)||digest(payload)!==bundle.bundleDigest)throw new Error('Public bundle digest mismatch');
  const aad=assertContext({chainId:bundle.chainId,purpose:bundle.purpose,associatedData:bundle.associatedData},bundle.letterId);
  if(aad.unlockAt!==bundle.unlockAt||aad.recipient!==bundle.recipient)throw new Error('Public bundle context mismatch');
  if(bundle.algorithm!=='AES-256-GCM'||typeof bundle.sealedShareA!=='string'||bundle.sealedShareA.length<16)throw new Error('Public bundle encryption fields are incomplete');
  bytes(fromB64url(bundle.iv,'iv'),'iv',12);
  const ciphertext=fromB64url(bundle.ciphertext,'ciphertext');
  if(ciphertext.length<17||keccak256(ciphertext)!==bundle.registration?.ciphertextHash)throw new Error('Ciphertext hash mismatch');
  const expected={
    letterId:keccak256(toHex(bundle.purpose)),
    recipientBinding:keccak256(toHex(`${bundle.chainId}:${bundle.recipient}`))
  };
  if(bundle.registration.letterId!==expected.letterId||bundle.registration.recipientBinding!==expected.recipientBinding||!HASH.test(bundle.registration.shareBCommitment))throw new Error('Registration binding mismatch');
  for(const forbidden of ['plaintext','shareA','shareB','contentKey','privateKey','mnemonic','password'])if(forbidden in bundle)throw new Error(`Forbidden private field: ${forbidden}`);
  return {status:'PUBLIC_BUNDLE_VERIFIED',bundleDigest:bundle.bundleDigest,registration:{...bundle.registration},unlockAt:bundle.unlockAt,recipient:bundle.recipient};
}

export function registrationInputFromBundle({bundle,from,contract,observedBlockTime}){
  const verified=validatePublicBundle(bundle);
  if(!isAddress(from)||!isAddress(contract))throw new TypeError('Valid EVM from and contract addresses are required');
  if(!Number.isSafeInteger(observedBlockTime)||observedBlockTime<1)throw new TypeError('Observed block time must be Unix seconds');
  return {operation:'register',chainId:9800,rpc:'https://evm-testnet.qore.host',from,contract,...verified.registration,unlockAt:Math.floor(Date.parse(verified.unlockAt)/1000),observedBlockTime};
}
