'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('./token.js');
var _0uint = require('./0uint.js');
var common = require('./common.js');

function toToken(_data, _pos, prefix, length) {
  return new token.Token(token.Type.map, length, prefix);
}
function decodeMapCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
function decodeMap8(data, pos, _minor, options) {
  return toToken(data, pos, 2, _0uint.readUint8(data, pos + 1, options));
}
function decodeMap16(data, pos, _minor, options) {
  return toToken(data, pos, 3, _0uint.readUint16(data, pos + 1, options));
}
function decodeMap32(data, pos, _minor, options) {
  return toToken(data, pos, 5, _0uint.readUint32(data, pos + 1, options));
}
function decodeMap64(data, pos, _minor, options) {
  const l = _0uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ common.decodeErrPrefix } 64-bit integer map lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
function decodeMapIndefinite(data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ common.decodeErrPrefix } indefinite length items not allowed`);
  }
  return toToken(data, pos, 1, Infinity);
}
function encodeMap(buf, token$1) {
  _0uint.encodeUintValue(buf, token.Type.map.majorEncoded, token$1.value);
}
encodeMap.compareTokens = _0uint.encodeUint.compareTokens;
encodeMap.encodedSize = function encodedSize(token) {
  return _0uint.encodeUintValue.encodedSize(token.value);
};

exports.decodeMap16 = decodeMap16;
exports.decodeMap32 = decodeMap32;
exports.decodeMap64 = decodeMap64;
exports.decodeMap8 = decodeMap8;
exports.decodeMapCompact = decodeMapCompact;
exports.decodeMapIndefinite = decodeMapIndefinite;
exports.encodeMap = encodeMap;
