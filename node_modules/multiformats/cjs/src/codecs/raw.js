'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bytes = require('../bytes.js');

const name = 'raw';
const code = 85;
const encode = node => bytes.coerce(node);
const decode = data => bytes.coerce(data);

exports.code = code;
exports.decode = decode;
exports.encode = encode;
exports.name = name;
