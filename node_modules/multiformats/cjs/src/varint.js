'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var varint$1 = require('../vendor/varint.js');

const decode = (data, offset = 0) => {
  const code = varint$1.decode(data, offset);
  return [
    code,
    varint$1.decode.bytes
  ];
};
const encodeTo = (int, target, offset = 0) => {
  varint$1.encode(int, target, offset);
  return target;
};
const encodingLength = int => {
  return varint$1.encodingLength(int);
};

exports.decode = decode;
exports.encodeTo = encodeTo;
exports.encodingLength = encodingLength;
