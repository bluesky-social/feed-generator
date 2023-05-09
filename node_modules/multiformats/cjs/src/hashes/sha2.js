'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crypto = require('crypto');
var hasher = require('./hasher.js');
var bytes = require('../bytes.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

const sha256 = hasher.from({
  name: 'sha2-256',
  code: 18,
  encode: input => bytes.coerce(crypto__default["default"].createHash('sha256').update(input).digest())
});
const sha512 = hasher.from({
  name: 'sha2-512',
  code: 19,
  encode: input => bytes.coerce(crypto__default["default"].createHash('sha512').update(input).digest())
});

exports.sha256 = sha256;
exports.sha512 = sha512;
