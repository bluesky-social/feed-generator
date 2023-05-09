import {
  Token,
  Type
} from './token.js';
import * as uint from './0uint.js';
export function decodeTagCompact(_data, _pos, minor, _options) {
  return new Token(Type.tag, minor, 1);
}
export function decodeTag8(data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint8(data, pos + 1, options), 2);
}
export function decodeTag16(data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint16(data, pos + 1, options), 3);
}
export function decodeTag32(data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint32(data, pos + 1, options), 5);
}
export function decodeTag64(data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint64(data, pos + 1, options), 9);
}
export function encodeTag(buf, token) {
  uint.encodeUintValue(buf, Type.tag.majorEncoded, token.value);
}
encodeTag.compareTokens = uint.encodeUint.compareTokens;
encodeTag.encodedSize = function encodedSize(token) {
  return uint.encodeUintValue.encodedSize(token.value);
};