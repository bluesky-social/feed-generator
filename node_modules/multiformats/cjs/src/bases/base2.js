'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var base = require('./base.js');

const base2 = base.rfc4648({
  prefix: '0',
  name: 'base2',
  alphabet: '01',
  bitsPerChar: 1
});

exports.base2 = base2;
