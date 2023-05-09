'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('./token.js');
var _0uint = require('./0uint.js');
var common = require('./common.js');

function decodeNegint8(data, pos, _minor, options) {
  return new token.Token(token.Type.negint, -1 - _0uint.readUint8(data, pos + 1, options), 2);
}
function decodeNegint16(data, pos, _minor, options) {
  return new token.Token(token.Type.negint, -1 - _0uint.readUint16(data, pos + 1, options), 3);
}
function decodeNegint32(data, pos, _minor, options) {
  return new token.Token(token.Type.negint, -1 - _0uint.readUint32(data, pos + 1, options), 5);
}
const neg1b = BigInt(-1);
const pos1b = BigInt(1);
function decodeNegint64(data, pos, _minor, options) {
  const int = _0uint.readUint64(data, pos + 1, options);
  if (typeof int !== 'bigint') {
    const value = -1 - int;
    if (value >= Number.MIN_SAFE_INTEGER) {
      return new token.Token(token.Type.negint, value, 9);
    }
  }
  if (options.allowBigInt !== true) {
    throw new Error(`${ common.decodeErrPrefix } integers outside of the safe integer range are not supported`);
  }
  return new token.Token(token.Type.negint, neg1b - BigInt(int), 9);
}
function encodeNegint(buf, token) {
  const negint = token.value;
  const unsigned = typeof negint === 'bigint' ? negint * neg1b - pos1b : negint * -1 - 1;
  _0uint.encodeUintValue(buf, token.type.majorEncoded, unsigned);
}
encodeNegint.encodedSize = function encodedSize(token) {
  const negint = token.value;
  const unsigned = typeof negint === 'bigint' ? negint * neg1b - pos1b : negint * -1 - 1;
  if (unsigned < _0uint.uintBoundaries[0]) {
    return 1;
  }
  if (unsigned < _0uint.uintBoundaries[1]) {
    return 2;
  }
  if (unsigned < _0uint.uintBoundaries[2]) {
    return 3;
  }
  if (unsigned < _0uint.uintBoundaries[3]) {
    return 5;
  }
  return 9;
};
encodeNegint.compareTokens = function compareTokens(tok1, tok2) {
  return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : 0;
};

exports.decodeNegint16 = decodeNegint16;
exports.decodeNegint32 = decodeNegint32;
exports.decodeNegint64 = decodeNegint64;
exports.decodeNegint8 = decodeNegint8;
exports.encodeNegint = encodeNegint;
