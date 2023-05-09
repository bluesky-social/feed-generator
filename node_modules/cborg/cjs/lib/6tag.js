'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('./token.js');
var _0uint = require('./0uint.js');

function decodeTagCompact(_data, _pos, minor, _options) {
  return new token.Token(token.Type.tag, minor, 1);
}
function decodeTag8(data, pos, _minor, options) {
  return new token.Token(token.Type.tag, _0uint.readUint8(data, pos + 1, options), 2);
}
function decodeTag16(data, pos, _minor, options) {
  return new token.Token(token.Type.tag, _0uint.readUint16(data, pos + 1, options), 3);
}
function decodeTag32(data, pos, _minor, options) {
  return new token.Token(token.Type.tag, _0uint.readUint32(data, pos + 1, options), 5);
}
function decodeTag64(data, pos, _minor, options) {
  return new token.Token(token.Type.tag, _0uint.readUint64(data, pos + 1, options), 9);
}
function encodeTag(buf, token$1) {
  _0uint.encodeUintValue(buf, token.Type.tag.majorEncoded, token$1.value);
}
encodeTag.compareTokens = _0uint.encodeUint.compareTokens;
encodeTag.encodedSize = function encodedSize(token) {
  return _0uint.encodeUintValue.encodedSize(token.value);
};

exports.decodeTag16 = decodeTag16;
exports.decodeTag32 = decodeTag32;
exports.decodeTag64 = decodeTag64;
exports.decodeTag8 = decodeTag8;
exports.decodeTagCompact = decodeTagCompact;
exports.encodeTag = encodeTag;
