/* eslint-env mocha */

import chai from 'chai'

import { decode, encode } from '../cborg.js'
import { fromHex, toHex } from '../lib/byte-utils.js'

const { assert } = chai

// some from https://github.com/PJK/libcbor

const fixtures = [
  { data: '00', expected: 0, type: 'uint8' },
  { data: '02', expected: 2, type: 'uint8' },
  { data: '18ff', expected: 255, type: 'uint8' },
  { data: '1901f4', expected: 500, type: 'uint16' },
  { data: '1900ff', expected: 255, type: 'uint16', strict: false },
  { data: '19ffff', expected: 65535, type: 'uint16' },
  { data: '1a000000ff', expected: 255, type: 'uint32', strict: false },
  { data: '1a00010000', expected: 65536, type: 'uint32' },
  { data: '1a000f4240', expected: 1000000, type: 'uint32' },
  { data: '1aa5f702b3', expected: 2784428723, type: 'uint32' },
  { data: '1b00000000000000ff', expected: 255, type: 'uint64', strict: false },
  { data: '1b0016db6db6db6db7', expected: Number.MAX_SAFE_INTEGER / 1.4, type: 'uint64' },
  { data: '1b001fffffffffffff', expected: Number.MAX_SAFE_INTEGER, type: 'uint64' },
  { data: '1ba5f702b3a5f702b3', expected: BigInt('11959030306112471731'), type: 'uint64' },
  { data: '1bffffffffffffffff', expected: BigInt('18446744073709551615'), type: 'uint64' }
]

describe('uint', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = fromHex(fixture.data)
      it(`should decode ${fixture.type}=${fixture.expected}`, () => {
        assert.ok(decode(data) === fixture.expected, `decode ${fixture.type} ${decode(data)} != ${fixture.expected}`)
        if (fixture.strict === false) {
          assert.throws(() => decode(data, { strict: true }), Error, 'CBOR decode error: integer encoded in more bytes than necessary (strict decode)')
        } else {
          assert.ok(decode(data, { strict: true }) === fixture.expected, `decode ${fixture.type}`)
        }
      })
    }
  })

  it('should throw error', () => {
    // minor number 28, too high for uint
    assert.throws(() => decode(fromHex('1ca5f702b3a5f702b3')), Error, 'CBOR decode error: encountered invalid minor (28) for major 0')
    assert.throws(() => decode(fromHex('1ba5f702b3a5f702')), Error, 'CBOR decode error: not enough data for type')
  })

  describe('encode', () => {
    for (const fixture of fixtures) {
      it(`should encode ${fixture.type}=${fixture.expected}`, () => {
        if (fixture.strict === false) {
          assert.notStrictEqual(toHex(encode(fixture.expected)), fixture.data, `encode ${fixture.type} !strict`)
        } else {
          assert.strictEqual(toHex(encode(fixture.expected)), fixture.data, `encode ${fixture.type}`)
        }
      })
    }
  })

  // mostly unnecessary, but feels good
  describe('roundtrip', () => {
    for (const fixture of fixtures) {
      if (fixture.strict !== false) {
        it(`should roundtrip ${fixture.type}=${fixture.expected}`, () => {
          assert.ok(decode(encode(fixture.expected)) === fixture.expected, `roundtrip ${fixture.type}`)
        })
      }
    }
  })

  describe('toobig', () => {
    it('bigger than 64-bit', () => {
      // boundary condition is right on 64-bit int
      assert.doesNotThrow(() => encode(BigInt('18446744073709551615') /* BigInt(2) ** BigInt(64) - BigInt(1) */))
      assert.throws(() => encode(BigInt('18446744073709551616') /* BigInt(2) ** BigInt(64) */), /BigInt larger than allowable range/)
    })

    it('disallow BigInt', () => {
      for (const fixture of fixtures) {
        const data = fromHex(fixture.data)
        if (!Number.isSafeInteger(fixture.expected)) {
          assert.throws(() => decode(data, { allowBigInt: false }), /safe integer range/)
        } else {
          assert.ok(decode(data, { allowBigInt: false }) === fixture.expected, `decode ${fixture.type}`)
        }
      }
    })
  })

  describe('toosmall', () => {
    for (const fixture of fixtures) {
      if (fixture.strict !== false && typeof fixture.expected === 'number') {
        const small = BigInt(fixture.expected)
        it(`should encode ${small}n`, () => {
          assert.strictEqual(toHex(encode(BigInt(small))), fixture.data, `encode ${small}`)
        })
      }
    }
  })
})
