'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bytes = require('../bytes.js');
var digest$1 = require('./digest.js');

const code = 0;
const name = 'identity';
const encode = bytes.coerce;
const digest = input => digest$1.create(code, encode(input));
const identity = {
  code,
  name,
  encode,
  digest
};

exports.identity = identity;
