'use strict';

var ipldGarbage = require('ipld-garbage');
require('../cborg.js');
var chai = require('chai');
var encode = require('../lib/encode.js');
var decode = require('../lib/decode.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);

const {assert} = chai__default["default"];
describe('Fuzz round-trip', () => {
  it('random objects', function () {
    this.timeout(5000);
    for (let i = 0; i < 1000; i++) {
      const obj = ipldGarbage.garbage(300, { weights: { CID: 0 } });
      const byts = encode.encode(obj);
      const decoded = decode.decode(byts);
      assert.deepEqual(decoded, obj);
    }
  });
  it('circular references error', () => {
    let obj = {};
    obj.obj = obj;
    assert.throws(() => encode.encode(obj), /circular references/);
    obj = {
      blip: [
        1,
        2,
        { blop: {} }
      ]
    };
    obj.blip[2].blop.boop = obj;
    assert.throws(() => encode.encode(obj), /circular references/);
    obj = {
      blip: [
        1,
        2,
        { blop: {} }
      ]
    };
    obj.blip[2].blop.boop = obj.blip;
    assert.throws(() => encode.encode(obj), /circular references/);
    obj = {
      blip: {},
      bloop: {}
    };
    obj.bloop = obj.blip;
    assert.doesNotThrow(() => encode.encode(obj));
    const arr = [];
    arr[0] = arr;
    assert.throws(() => encode.encode(arr), /circular references/);
  });
});
