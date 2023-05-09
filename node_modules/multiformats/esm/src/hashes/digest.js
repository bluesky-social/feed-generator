import {
  coerce,
  equals as equalBytes
} from '../bytes.js';
import * as varint from '../varint.js';
export const create = (code, digest) => {
  const size = digest.byteLength;
  const sizeOffset = varint.encodingLength(code);
  const digestOffset = sizeOffset + varint.encodingLength(size);
  const bytes = new Uint8Array(digestOffset + size);
  varint.encodeTo(code, bytes, 0);
  varint.encodeTo(size, bytes, sizeOffset);
  bytes.set(digest, digestOffset);
  return new Digest(code, size, digest, bytes);
};
export const decode = multihash => {
  const bytes = coerce(multihash);
  const [code, sizeOffset] = varint.decode(bytes);
  const [size, digestOffset] = varint.decode(bytes.subarray(sizeOffset));
  const digest = bytes.subarray(sizeOffset + digestOffset);
  if (digest.byteLength !== size) {
    throw new Error('Incorrect length');
  }
  return new Digest(code, size, digest, bytes);
};
export const equals = (a, b) => {
  if (a === b) {
    return true;
  } else {
    return a.code === b.code && a.size === b.size && equalBytes(a.bytes, b.bytes);
  }
};
export class Digest {
  constructor(code, size, digest, bytes) {
    this.code = code;
    this.size = size;
    this.digest = digest;
    this.bytes = bytes;
  }
}