'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var base = require('./base.js');
var bytes = require('../bytes.js');

const identity = base.from({
  prefix: '\0',
  name: 'identity',
  encode: buf => bytes.toString(buf),
  decode: str => bytes.fromString(str)
});

exports.identity = identity;
