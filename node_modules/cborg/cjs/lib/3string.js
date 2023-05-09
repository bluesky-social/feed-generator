'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('./token.js');
var common = require('./common.js');
var _0uint = require('./0uint.js');
var _2bytes = require('./2bytes.js');
var byteUtils = require('./byte-utils.js');

function toToken(data, pos, prefix, length, options) {
  const totLength = prefix + length;
  common.assertEnoughData(data, pos, totLength);
  const tok = new token.Token(token.Type.string, byteUtils.toString(data, pos + prefix, pos + totLength), totLength);
  if (options.retainStringBytes === true) {
    tok.byteValue = byteUtils.slice(data, pos + prefix, pos + totLength);
  }
  return tok;
}
function decodeStringCompact(data, pos, minor, options) {
  return toToken(data, pos, 1, minor, options);
}
function decodeString8(data, pos, _minor, options) {
  return toToken(data, pos, 2, _0uint.readUint8(data, pos + 1, options), options);
}
function decodeString16(data, pos, _minor, options) {
  return toToken(data, pos, 3, _0uint.readUint16(data, pos + 1, options), options);
}
function decodeString32(data, pos, _minor, options) {
  return toToken(data, pos, 5, _0uint.readUint32(data, pos + 1, options), options);
}
function decodeString64(data, pos, _minor, options) {
  const l = _0uint.readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ common.decodeErrPrefix } 64-bit integer string lengths not supported`);
  }
  return toToken(data, pos, 9, l, options);
}
const encodeString = _2bytes.encodeBytes;

exports.decodeString16 = decodeString16;
exports.decodeString32 = decodeString32;
exports.decodeString64 = decodeString64;
exports.decodeString8 = decodeString8;
exports.decodeStringCompact = decodeStringCompact;
exports.encodeString = encodeString;
