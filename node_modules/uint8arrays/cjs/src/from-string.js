'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bases = require('./util/bases.js');

function fromString(string, encoding = 'utf8') {
  const base = bases[encoding];
  if (!base) {
    throw new Error(`Unsupported encoding "${ encoding }"`);
  }
  return base.decoder.decode(`${ base.prefix }${ string }`);
}

exports.fromString = fromString;
