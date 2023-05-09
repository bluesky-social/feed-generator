'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var base = require('./base.js');

const base8 = base.rfc4648({
  prefix: '7',
  name: 'base8',
  alphabet: '01234567',
  bitsPerChar: 3
});

exports.base8 = base8;
