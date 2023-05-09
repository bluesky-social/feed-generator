'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const name = 'json';
const code = 512;
const encode = node => textEncoder.encode(JSON.stringify(node));
const decode = data => JSON.parse(textDecoder.decode(data));

exports.code = code;
exports.decode = decode;
exports.encode = encode;
exports.name = name;
