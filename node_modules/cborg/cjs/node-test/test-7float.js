'use strict';

var chai = require('chai');
require('../cborg.js');
var byteUtils = require('../lib/byte-utils.js');
var decode = require('../lib/decode.js');
var encode = require('../lib/encode.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);

const {assert} = chai__default["default"];
const fixtures = [
  {
    data: '8601f5f4f6f720',
    expected: [
      1,
      true,
      false,
      null,
      undefined,
      -1
    ],
    type: 'array of float specials'
  },
  {
    data: 'f93800',
    expected: 0.5,
    type: 'float16'
  },
  {
    data: 'f9b800',
    expected: -0.5,
    type: 'float16'
  },
  {
    data: 'fa33c00000',
    expected: 8.940696716308594e-8,
    type: 'float32'
  },
  {
    data: 'fab3c00000',
    expected: -8.940696716308594e-8,
    type: 'float32'
  },
  {
    data: 'fb3ff199999999999a',
    expected: 1.1,
    type: 'float64'
  },
  {
    data: 'fbbff199999999999a',
    expected: -1.1,
    type: 'float64'
  },
  {
    data: 'fb3ff1c71c71c71c72',
    expected: 1.1111111111111112,
    type: 'float64'
  },
  {
    data: 'fb0000000000000002',
    expected: 1e-323,
    type: 'float64'
  },
  {
    data: 'fb8000000000000002',
    expected: -1e-323,
    type: 'float64'
  },
  {
    data: 'fb3fefffffffffffff',
    expected: 0.9999999999999999,
    type: 'float64'
  },
  {
    data: 'fbbfefffffffffffff',
    expected: -0.9999999999999999,
    type: 'float64'
  },
  {
    data: 'f97c00',
    expected: Infinity,
    type: 'Infinity'
  },
  {
    data: 'fb7ff0000000000000',
    expected: Infinity,
    type: 'Infinity',
    strict: false
  },
  {
    data: 'f9fc00',
    expected: -Infinity,
    type: '-Infinity'
  },
  {
    data: 'fbfff0000000000000',
    expected: -Infinity,
    type: '-Infinity',
    strict: false
  },
  {
    data: 'f97e00',
    expected: NaN,
    type: 'NaN'
  },
  {
    data: 'f97ff8',
    expected: NaN,
    type: 'NaN',
    strict: false
  },
  {
    data: 'fa7ff80000',
    expected: NaN,
    type: 'NaN',
    strict: false
  },
  {
    data: 'fb7ff8000000000000',
    expected: NaN,
    type: 'NaN',
    strict: false
  },
  {
    data: 'fb7ff8cafedeadbeef',
    expected: NaN,
    type: 'NaN',
    strict: false
  },
  {
    data: 'fb40f4241a31a5a515',
    expected: 82497.63712086187,
    type: 'float64'
  }
];
describe('float', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = byteUtils.fromHex(fixture.data);
      it(`should decode ${ fixture.type }=${ fixture.expected }`, () => {
        assert.deepStrictEqual(decode.decode(data), fixture.expected, `decode ${ fixture.type }`);
        assert.deepStrictEqual(decode.decode(data, { strict: true }), fixture.expected, `decode ${ fixture.type }`);
      });
    }
  });
  it('error', () => {
    assert.throws(() => decode.decode(byteUtils.fromHex('f80000')), Error, 'simple values are not supported');
    assert.throws(() => decode.decode(byteUtils.fromHex('f900')), Error, 'not enough data for float16');
    assert.throws(() => decode.decode(byteUtils.fromHex('fa0000')), Error, 'not enough data for float32');
    assert.throws(() => decode.decode(byteUtils.fromHex('fb00000000')), Error, 'not enough data for float64');
  });
  describe('encode', () => {
    for (const fixture of fixtures) {
      if (fixture.strict !== false) {
        it(`should encode ${ fixture.type }=${ fixture.expected }`, () => {
          assert.strictEqual(byteUtils.toHex(encode.encode(fixture.expected)), fixture.data, `encode ${ fixture.type }`);
        });
      }
    }
  });
  describe('encode float64', () => {
    for (const fixture of fixtures) {
      if (fixture.type.startsWith('float')) {
        it(`should encode ${ fixture.type }=${ fixture.expected }`, () => {
          const encoded = encode.encode(fixture.expected, { float64: true });
          assert.strictEqual(encoded.length, 9);
          assert.strictEqual(encoded[0], 251);
          assert.strictEqual(decode.decode(encoded), fixture.expected, `encode float64 ${ fixture.type }`);
        });
      }
    }
  });
  describe('roundtrip', () => {
    for (const fixture of fixtures) {
      if (!fixture.unsafe && fixture.strict !== false) {
        it(`should roundtrip ${ fixture.type }=${ fixture.expected }`, () => {
          assert.deepStrictEqual(decode.decode(encode.encode(fixture.expected)), fixture.expected, `roundtrip ${ fixture.type }`);
        });
      }
    }
  });
  describe('specials', () => {
    it('indefinite length switch fails on BREAK', () => {
      assert.throws(() => decode.decode(Uint8Array.from([
        131,
        1,
        2,
        255
      ])), /unexpected break to lengthed array/);
      assert.throws(() => decode.decode(Uint8Array.from([
        131,
        1,
        2,
        255
      ]), { allowIndefinite: false }), /indefinite/);
    });
    it('can switch off undefined support', () => {
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('f7')), undefined);
      assert.throws(() => decode.decode(byteUtils.fromHex('f7'), { allowUndefined: false }), /undefined/);
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('830102f7')), [
        1,
        2,
        undefined
      ]);
      assert.throws(() => decode.decode(byteUtils.fromHex('830102f7'), { allowUndefined: false }), /undefined/);
    });
    it('can coerce undefined to null', () => {
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('f7'), { coerceUndefinedToNull: false }), undefined);
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('f7'), { coerceUndefinedToNull: true }), null);
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('830102f7'), { coerceUndefinedToNull: false }), [
        1,
        2,
        undefined
      ]);
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('830102f7'), { coerceUndefinedToNull: true }), [
        1,
        2,
        null
      ]);
    });
    it('can switch off Infinity support', () => {
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('830102f97c00')), [
        1,
        2,
        Infinity
      ]);
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('830102f9fc00')), [
        1,
        2,
        -Infinity
      ]);
      assert.throws(() => decode.decode(byteUtils.fromHex('830102f97c00'), { allowInfinity: false }), /Infinity/);
      assert.throws(() => decode.decode(byteUtils.fromHex('830102f9fc00'), { allowInfinity: false }), /Infinity/);
      for (const fixture of fixtures.filter(f => f.type.endsWith('Infinity'))) {
        assert.throws(() => decode.decode(byteUtils.fromHex(fixture.data), { allowInfinity: false }), /Infinity/);
      }
    });
    it('can switch off NaN support', () => {
      assert.deepStrictEqual(decode.decode(byteUtils.fromHex('830102f97e00')), [
        1,
        2,
        NaN
      ]);
      assert.throws(() => decode.decode(byteUtils.fromHex('830102f97e00'), { allowNaN: false }), /NaN/);
      for (const fixture of fixtures.filter(f => f.type === 'NaN')) {
        assert.throws(() => decode.decode(byteUtils.fromHex(fixture.data), { allowNaN: false }), /NaN/);
      }
    });
  });
});
