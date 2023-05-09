import {
  Token,
  Type
} from './token.js';
import * as uint from './0uint.js';
import { decodeErrPrefix } from './common.js';
function toToken(_data, _pos, prefix, length) {
  return new Token(Type.array, length, prefix);
}
export function decodeArrayCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
export function decodeArray8(data, pos, _minor, options) {
  return toToken(data, pos, 2, uint.readUint8(data, pos + 1, options));
}
export function decodeArray16(data, pos, _minor, options) {
  return toToken(data, pos, 3, uint.readUint16(data, pos + 1, options));
}
export function decodeArray32(data, pos, _minor, options) {
  return toToken(data, pos, 5, uint.readUint32(data, pos + 1, options));
}
export function decodeArray64(data, pos, _minor, options) {
  const l = uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer array lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
export function decodeArrayIndefinite(data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ decodeErrPrefix } indefinite length items not allowed`);
  }
  return toToken(data, pos, 1, Infinity);
}
export function encodeArray(buf, token) {
  uint.encodeUintValue(buf, Type.array.majorEncoded, token.value);
}
encodeArray.compareTokens = uint.encodeUint.compareTokens;
encodeArray.encodedSize = function encodedSize(token) {
  return uint.encodeUintValue.encodedSize(token.value);
};