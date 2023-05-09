import {
  Token,
  Type
} from './token.js';
import {
  assertEnoughData,
  decodeErrPrefix
} from './common.js';
import * as uint from './0uint.js';
import {
  compare,
  fromString,
  slice
} from './byte-utils.js';
function toToken(data, pos, prefix, length) {
  assertEnoughData(data, pos, prefix + length);
  const buf = slice(data, pos + prefix, pos + prefix + length);
  return new Token(Type.bytes, buf, prefix + length);
}
export function decodeBytesCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
export function decodeBytes8(data, pos, _minor, options) {
  return toToken(data, pos, 2, uint.readUint8(data, pos + 1, options));
}
export function decodeBytes16(data, pos, _minor, options) {
  return toToken(data, pos, 3, uint.readUint16(data, pos + 1, options));
}
export function decodeBytes32(data, pos, _minor, options) {
  return toToken(data, pos, 5, uint.readUint32(data, pos + 1, options));
}
export function decodeBytes64(data, pos, _minor, options) {
  const l = uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer bytes lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
function tokenBytes(token) {
  if (token.encodedBytes === undefined) {
    token.encodedBytes = token.type === Type.string ? fromString(token.value) : token.value;
  }
  return token.encodedBytes;
}
export function encodeBytes(buf, token) {
  const bytes = tokenBytes(token);
  uint.encodeUintValue(buf, token.type.majorEncoded, bytes.length);
  buf.push(bytes);
}
encodeBytes.encodedSize = function encodedSize(token) {
  const bytes = tokenBytes(token);
  return uint.encodeUintValue.encodedSize(bytes.length) + bytes.length;
};
encodeBytes.compareTokens = function compareTokens(tok1, tok2) {
  return compareBytes(tokenBytes(tok1), tokenBytes(tok2));
};
export function compareBytes(b1, b2) {
  return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare(b1, b2);
}