'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('../lib/token.js');

function dateDecoder(obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 1');
  }
  return new Date(obj);
}
function dateEncoder(obj) {
  if (!(obj instanceof Date)) {
    throw new Error('expected Date for "Date" encoder');
  }
  return [
    new token.Token(token.Type.tag, 0),
    new token.Token(token.Type.string, obj.toISOString().replace(/\.000Z$/, 'Z'))
  ];
}

exports.dateDecoder = dateDecoder;
exports.dateEncoder = dateEncoder;
