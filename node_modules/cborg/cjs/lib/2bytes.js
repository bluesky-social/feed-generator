'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('./token.js');
var common = require('./common.js');
var _0uint = require('./0uint.js');
var byteUtils = require('./byte-utils.js');

function toToken(data, pos, prefix, length) {
  common.assertEnoughData(data, pos, prefix + length);
  const buf = byteUtils.slice(data, pos + prefix, pos + prefix + length);
  return new token.Token(token.Type.bytes, buf, prefix + length);
}
function decodeBytesCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
function decodeBytes8(data, pos, _minor, options) {
  return toToken(data, pos, 2, _0uint.readUint8(data, pos + 1, options));
}
function decodeBytes16(data, pos, _minor, options) {
  return toToken(data, pos, 3, _0uint.readUint16(data, pos + 1, options));
}
function decodeBytes32(data, pos, _minor, options) {
  return toToken(data, pos, 5, _0uint.readUint32(data, pos + 1, options));
}
function decodeBytes64(data, pos, _minor, options) {
  const l = _0uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ common.decodeErrPrefix } 64-bit integer bytes lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
function tokenBytes(token$1) {
  if (token$1.encodedBytes === undefined) {
    token$1.encodedBytes = token$1.type === token.Type.string ? byteUtils.fromString(token$1.value) : token$1.value;
  }
  return token$1.encodedBytes;
}
function encodeBytes(buf, token) {
  const bytes = tokenBytes(token);
  _0uint.encodeUintValue(buf, token.type.majorEncoded, bytes.length);
  buf.push(bytes);
}
encodeBytes.encodedSize = function encodedSize(token) {
  const bytes = tokenBytes(token);
  return _0uint.encodeUintValue.encodedSize(bytes.length) + bytes.length;
};
encodeBytes.compareTokens = function compareTokens(tok1, tok2) {
  return compareBytes(tokenBytes(tok1), tokenBytes(tok2));
};
function compareBytes(b1, b2) {
  return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : byteUtils.compare(b1, b2);
}

exports.compareBytes = compareBytes;
exports.decodeBytes16 = decodeBytes16;
exports.decodeBytes32 = decodeBytes32;
exports.decodeBytes64 = decodeBytes64;
exports.decodeBytes8 = decodeBytes8;
exports.decodeBytesCompact = decodeBytesCompact;
exports.encodeBytes = encodeBytes;
