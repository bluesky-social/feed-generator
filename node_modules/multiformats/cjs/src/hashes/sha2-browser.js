'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var hasher = require('./hasher.js');

const sha = name => async data => new Uint8Array(await crypto.subtle.digest(name, data));
const sha256 = hasher.from({
  name: 'sha2-256',
  code: 18,
  encode: sha('SHA-256')
});
const sha512 = hasher.from({
  name: 'sha2-512',
  code: 19,
  encode: sha('SHA-512')
});

exports.sha256 = sha256;
exports.sha512 = sha512;
