'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var identity = require('./bases/identity.js');
var base2 = require('./bases/base2.js');
var base8 = require('./bases/base8.js');
var base10 = require('./bases/base10.js');
var base16 = require('./bases/base16.js');
var base32 = require('./bases/base32.js');
var base36 = require('./bases/base36.js');
var base58 = require('./bases/base58.js');
var base64 = require('./bases/base64.js');
var base256emoji = require('./bases/base256emoji.js');
var sha2 = require('./hashes/sha2.js');
var identity$1 = require('./hashes/identity.js');
var raw = require('./codecs/raw.js');
var json = require('./codecs/json.js');
require('./index.js');
var cid = require('./cid.js');
var hasher = require('./hashes/hasher.js');
var digest = require('./hashes/digest.js');
var varint = require('./varint.js');
var bytes = require('./bytes.js');

const bases = {
  ...identity,
  ...base2,
  ...base8,
  ...base10,
  ...base16,
  ...base32,
  ...base36,
  ...base58,
  ...base64,
  ...base256emoji
};
const hashes = {
  ...sha2,
  ...identity$1
};
const codecs = {
  raw,
  json
};

exports.CID = cid.CID;
exports.hasher = hasher;
exports.digest = digest;
exports.varint = varint;
exports.bytes = bytes;
exports.bases = bases;
exports.codecs = codecs;
exports.hashes = hashes;
