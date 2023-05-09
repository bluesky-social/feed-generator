'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bases = require('./util/bases.js');

function toString(array, encoding = 'utf8') {
  const base = bases[encoding];
  if (!base) {
    throw new Error(`Unsupported encoding "${ encoding }"`);
  }
  return base.encoder.encode(array).substring(1);
}

exports.toString = toString;
