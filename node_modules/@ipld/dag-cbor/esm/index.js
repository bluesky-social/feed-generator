import * as cborg from 'cborg';
import { CID } from 'multiformats/cid';
const CID_CBOR_TAG = 42;
function cidEncoder(obj) {
  if (obj.asCID !== obj) {
    return null;
  }
  const cid = CID.asCID(obj);
  if (!cid) {
    return null;
  }
  const bytes = new Uint8Array(cid.bytes.byteLength + 1);
  bytes.set(cid.bytes, 1);
  return [
    new cborg.Token(cborg.Type.tag, CID_CBOR_TAG),
    new cborg.Token(cborg.Type.bytes, bytes)
  ];
}
function undefinedEncoder() {
  throw new Error('`undefined` is not supported by the IPLD Data Model and cannot be encoded');
}
function numberEncoder(num) {
  if (Number.isNaN(num)) {
    throw new Error('`NaN` is not supported by the IPLD Data Model and cannot be encoded');
  }
  if (num === Infinity || num === -Infinity) {
    throw new Error('`Infinity` and `-Infinity` is not supported by the IPLD Data Model and cannot be encoded');
  }
  return null;
}
const encodeOptions = {
  float64: true,
  typeEncoders: {
    Object: cidEncoder,
    undefined: undefinedEncoder,
    number: numberEncoder
  }
};
function cidDecoder(bytes) {
  if (bytes[0] !== 0) {
    throw new Error('Invalid CID for CBOR tag 42; expected leading 0x00');
  }
  return CID.decode(bytes.subarray(1));
}
const decodeOptions = {
  allowIndefinite: false,
  coerceUndefinedToNull: true,
  allowNaN: false,
  allowInfinity: false,
  allowBigInt: true,
  strict: true,
  useMaps: false,
  tags: []
};
decodeOptions.tags[CID_CBOR_TAG] = cidDecoder;
export const name = 'dag-cbor';
export const code = 113;
export const encode = node => cborg.encode(node, encodeOptions);
export const decode = data => cborg.decode(data, decodeOptions);