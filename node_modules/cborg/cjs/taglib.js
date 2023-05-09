'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./cborg.js');
var token = require('./lib/token.js');

const neg1b = BigInt(-1);
const pos1b = BigInt(1);
const zerob = BigInt(0);
const eightb = BigInt(8);
function bigIntDecoder(bytes) {
  let bi = zerob;
  for (let ii = 0; ii < bytes.length; ii++) {
    bi = (bi << eightb) + BigInt(bytes[ii]);
  }
  return bi;
}
function fromBigInt(bi) {
  const buf = [];
  while (bi > 0) {
    buf.unshift(Number(bi) & 255);
    bi >>= eightb;
  }
  return Uint8Array.from(buf);
}
const maxSafeBigInt = BigInt('18446744073709551615');
const minSafeBigInt = BigInt('-18446744073709551616');
function bigIntEncoder(obj) {
  if (obj >= minSafeBigInt && obj <= maxSafeBigInt) {
    return null;
  }
  return [
    new token.Token(token.Type.tag, obj >= zerob ? 2 : 3),
    new token.Token(token.Type.bytes, fromBigInt(obj >= zerob ? obj : obj * neg1b - pos1b))
  ];
}
function bigNegIntDecoder(bytes) {
  return neg1b - bigIntDecoder(bytes);
}

exports.bigIntDecoder = bigIntDecoder;
exports.bigIntEncoder = bigIntEncoder;
exports.bigNegIntDecoder = bigNegIntDecoder;
