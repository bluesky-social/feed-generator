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
    data: '20',
    expected: -1,
    type: 'negint8'
  },
  {
    data: '22',
    expected: -3,
    type: 'negint8'
  },
  {
    data: '3863',
    expected: -100,
    type: 'negint8'
  },
  {
    data: '38ff',
    expected: -256,
    type: 'negint8'
  },
  {
    data: '3900ff',
    expected: -256,
    type: 'negint16',
    strict: false
  },
  {
    data: '3901f4',
    expected: -501,
    type: 'negint16'
  },
  {
    data: '3a000000ff',
    expected: -256,
    type: 'negint32',
    strict: false
  },
  {
    data: '3aa5f702b3',
    expected: -2784428724,
    type: 'negint32'
  },
  {
    data: '3b00000000000000ff',
    expected: -256,
    type: 'negint32',
    strict: false
  },
  {
    data: '3b0016db6db6db6db7',
    expected: Number.MIN_SAFE_INTEGER / 1.4 - 1,
    type: 'negint64'
  },
  {
    data: '3b001ffffffffffffe',
    expected: Number.MIN_SAFE_INTEGER,
    type: 'negint64'
  },
  {
    data: '3b001fffffffffffff',
    expected: BigInt('-9007199254740992'),
    type: 'negint64'
  },
  {
    data: '3b0020000000000000',
    expected: BigInt('-9007199254740993'),
    type: 'negint64'
  },
  {
    data: '3ba5f702b3a5f702b3',
    expected: BigInt('-11959030306112471732'),
    type: 'negint64'
  },
  {
    data: '3bffffffffffffffff',
    expected: BigInt('-18446744073709551616'),
    type: 'negint64'
  }
];
describe('negint', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = byteUtils.fromHex(fixture.data);
      it(`should decode ${ fixture.type }=${ fixture.expected }`, () => {
        assert.ok(decode.decode(data) === fixture.expected, `decode ${ fixture.type } (${ decode.decode(data) } != ${ fixture.expected })`);
        if (fixture.strict === false) {
          assert.throws(() => decode.decode(data, { strict: true }), Error, 'CBOR decode error: integer encoded in more bytes than necessary (strict decode)');
        } else {
          assert.strictEqual(decode.decode(data, { strict: true }), fixture.expected, `decode ${ fixture.type }`);
        }
      });
    }
  });
  describe('encode', () => {
    for (const fixture of fixtures) {
      it(`should encode ${ fixture.type }=${ fixture.expected }`, () => {
        if (fixture.strict === false) {
          assert.notStrictEqual(byteUtils.toHex(encode.encode(fixture.expected)), fixture.data, `encode ${ fixture.type } !strict`);
        } else {
          assert.strictEqual(byteUtils.toHex(encode.encode(fixture.expected)), fixture.data, `encode ${ fixture.type }`);
        }
      });
    }
  });
  describe('roundtrip', () => {
    for (const fixture of fixtures) {
      it(`should roundtrip ${ fixture.type }=${ fixture.expected }`, () => {
        assert.ok(decode.decode(encode.encode(fixture.expected)) === fixture.expected, `roundtrip ${ fixture.type }`);
      });
    }
  });
  describe('toobig', () => {
    it('bigger than 64-bit', () => {
      assert.doesNotThrow(() => encode.encode(BigInt('-18446744073709551616')));
      assert.throws(() => encode.encode(BigInt('-18446744073709551617')), /BigInt larger than allowable range/);
    });
    it('disallow BigInt', () => {
      for (const fixture of fixtures) {
        const data = byteUtils.fromHex(fixture.data);
        if (!Number.isSafeInteger(fixture.expected)) {
          assert.throws(() => decode.decode(data, { allowBigInt: false }), /safe integer range/);
        } else {
          assert.ok(decode.decode(data, { allowBigInt: false }) === fixture.expected, `decode ${ fixture.type }`);
        }
      }
    });
  });
  describe('toosmall', () => {
    for (const fixture of fixtures) {
      if (fixture.strict !== false && typeof fixture.expected === 'number') {
        const small = BigInt(fixture.expected);
        it(`should encode ${ small }n`, () => {
          assert.strictEqual(byteUtils.toHex(encode.encode(BigInt(small))), fixture.data, `encode ${ small }`);
        });
      }
    }
  });
});
