'use strict';

var chai = require('chai');
var ipldGarbage = require('ipld-garbage');
var _0uint = require('../lib/0uint.js');
require('../cborg.js');
var length = require('../lib/length.js');
var common = require('./common.js');
var encode = require('../lib/encode.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);

const {assert} = chai__default["default"];
function verifyLength(object, options) {
  const len = length.encodedLength(object, options);
  const encoded = encode.encode(object, options);
  const actual = encoded.length;
  assert.strictEqual(actual, len, JSON.stringify(object));
}
describe('encodedLength', () => {
  it('int boundaries', () => {
    for (let ii = 0; ii < 4; ii++) {
      verifyLength(_0uint.uintBoundaries[ii]);
      verifyLength(_0uint.uintBoundaries[ii] - 1);
      verifyLength(_0uint.uintBoundaries[ii] + 1);
      verifyLength(-1 * _0uint.uintBoundaries[ii]);
      verifyLength(-1 * _0uint.uintBoundaries[ii] - 1);
      verifyLength(-1 * _0uint.uintBoundaries[ii] + 1);
    }
  });
  it('tags', () => {
    verifyLength({ date: new Date('2013-03-21T20:04:00Z') }, { typeEncoders: { Date: common.dateEncoder } });
  });
  it('floats', () => {
    verifyLength(0.5);
    verifyLength(0.5, { float64: true });
    verifyLength(8.940696716308594e-8);
    verifyLength(8.940696716308594e-8, { float64: true });
  });
  it('small garbage', function () {
    this.timeout(10000);
    for (let ii = 0; ii < 1000; ii++) {
      const gbg = ipldGarbage.garbage(1 << 6, { weights: { CID: 0 } });
      verifyLength(gbg);
    }
  });
  it('medium garbage', function () {
    this.timeout(10000);
    for (let ii = 0; ii < 100; ii++) {
      const gbg = ipldGarbage.garbage(1 << 16, { weights: { CID: 0 } });
      verifyLength(gbg);
    }
  });
  it('large garbage', function () {
    this.timeout(10000);
    for (let ii = 0; ii < 10; ii++) {
      const gbg = ipldGarbage.garbage(1 << 20, { weights: { CID: 0 } });
      verifyLength(gbg);
    }
  });
});
