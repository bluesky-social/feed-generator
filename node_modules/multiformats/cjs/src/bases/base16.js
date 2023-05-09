'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var base = require('./base.js');

const base16 = base.rfc4648({
  prefix: 'f',
  name: 'base16',
  alphabet: '0123456789abcdef',
  bitsPerChar: 4
});
const base16upper = base.rfc4648({
  prefix: 'F',
  name: 'base16upper',
  alphabet: '0123456789ABCDEF',
  bitsPerChar: 4
});

exports.base16 = base16;
exports.base16upper = base16upper;
