import {
  Token,
  Type
} from './token.js';
import * as uint from './0uint.js';
import { decodeErrPrefix } from './common.js';
function toToken(_data, _pos, prefix, length) {
  return new Token(Type.map, length, prefix);
}
export function decodeMapCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
export function decodeMap8(data, pos, _minor, options) {
  return toToken(data, pos, 2, uint.readUint8(data, pos + 1, options));
}
export function decodeMap16(data, pos, _minor, options) {
  return toToken(data, pos, 3, uint.readUint16(data, pos + 1, options));
}
export function decodeMap32(data, pos, _minor, options) {
  return toToken(data, pos, 5, uint.readUint32(data, pos + 1, options));
}
export function decodeMap64(data, pos, _minor, options) {
  const l = uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer map lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
export function decodeMapIndefinite(data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ decodeErrPrefix } indefinite length items not allowed`);
  }
  return toToken(data, pos, 1, Infinity);
}
export function encodeMap(buf, token) {
  uint.encodeUintValue(buf, Type.map.majorEncoded, token.value);
}
encodeMap.compareTokens = uint.encodeUint.compareTokens;
encodeMap.encodedSize = function encodedSize(token) {
  return uint.encodeUintValue.encodedSize(token.value);
};