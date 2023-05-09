'use strict';

var chai = require('chai');
require('../cborg.js');
var byteUtils = require('../lib/byte-utils.js');
var decode = require('../lib/decode.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);

const {assert} = chai__default["default"];
describe('decode errors', () => {
  it('not Uint8Array', () => {
    for (const arg of [
        true,
        false,
        null,
        undefined,
        'string',
        { obj: 'ect' },
        {},
        ['array'],
        [],
        [
          1,
          2,
          3
        ],
        0,
        100,
        1.1,
        -1,
        Symbol.for('nope')
      ]) {
      assert.throws(() => decode.decode(arg), /CBOR decode error.*must be a Uint8Array/);
    }
  });
  it('no data', () => {
    assert.throws(() => decode.decode(new Uint8Array('')), /CBOR decode error.*content/);
  });
  it('break only', () => {
    assert.throws(() => decode.decode(new Uint8Array([255])), /CBOR decode error.*break/);
  });
  it('not enough map entries (value)', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('a2616f016174')), /map.*not enough entries.*value/);
  });
  it('not enough map entries (key)', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('a2616f01')), /map.*not enough entries.*key/);
  });
  it('break in lengthed map', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('a2616f01ff740f')), /unexpected break to lengthed map/);
  });
  it('not enough array entries', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('82616f')), /array.*not enough entries/);
  });
  it('break in lengthed array', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('82ff')), /unexpected break to lengthed array/);
  });
  it('no such decoder', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('82ff')), /unexpected break to lengthed array/);
  });
  it('too many terminals', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('0101')), /too many terminals/);
  });
  it('rejectDuplicateMapKeys enabled on duplicate keys', () => {
    assert.deepStrictEqual(decode.decode(byteUtils.fromHex('a3636261720363666f6f0163666f6f02')), {
      foo: 2,
      bar: 3
    });
    assert.throws(() => decode.decode(byteUtils.fromHex('a3636261720363666f6f0163666f6f02'), { rejectDuplicateMapKeys: true }), /CBOR decode error: found repeat map key "foo"/);
    assert.throws(() => decode.decode(byteUtils.fromHex('a3636261720363666f6f0163666f6f02'), {
      useMaps: true,
      rejectDuplicateMapKeys: true
    }), /CBOR decode error: found repeat map key "foo"/);
  });
});
