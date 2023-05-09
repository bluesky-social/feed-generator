'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('./token.js');
var _0uint = require('./0uint.js');
var common = require('./common.js');

function toToken(_data, _pos, prefix, length) {
  return new token.Token(token.Type.array, length, prefix);
}
function decodeArrayCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
function decodeArray8(data, pos, _minor, options) {
  return toToken(data, pos, 2, _0uint.readUint8(data, pos + 1, options));
}
function decodeArray16(data, pos, _minor, options) {
  return toToken(data, pos, 3, _0uint.readUint16(data, pos + 1, options));
}
function decodeArray32(data, pos, _minor, options) {
  return toToken(data, pos, 5, _0uint.readUint32(data, pos + 1, options));
}
function decodeArray64(data, pos, _minor, options) {
  const l = _0uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ common.decodeErrPrefix } 64-bit integer array lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
function decodeArrayIndefinite(data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ common.decodeErrPrefix } indefinite length items not allowed`);
  }
  return toToken(data, pos, 1, Infinity);
}
function encodeArray(buf, token$1) {
  _0uint.encodeUintValue(buf, token.Type.array.majorEncoded, token$1.value);
}
encodeArray.compareTokens = _0uint.encodeUint.compareTokens;
encodeArray.encodedSize = function encodedSize(token) {
  return _0uint.encodeUintValue.encodedSize(token.value);
};

exports.decodeArray16 = decodeArray16;
exports.decodeArray32 = decodeArray32;
exports.decodeArray64 = decodeArray64;
exports.decodeArray8 = decodeArray8;
exports.decodeArrayCompact = decodeArrayCompact;
exports.decodeArrayIndefinite = decodeArrayIndefinite;
exports.encodeArray = encodeArray;
