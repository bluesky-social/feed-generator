/* globals describe, it */
import * as bytes from '../src/bytes.js'
import * as b2 from 'multiformats/bases/base2'
import * as b8 from 'multiformats/bases/base8'
import * as b10 from 'multiformats/bases/base10'
import * as b16 from 'multiformats/bases/base16'
import * as b32 from 'multiformats/bases/base32'
import * as b36 from 'multiformats/bases/base36'
import * as b58 from 'multiformats/bases/base58'
import * as b64 from 'multiformats/bases/base64'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const { assert } = chai

const { base16, base32, base58btc, base64 } = { ...b16, ...b32, ...b58, ...b64 }

describe('multibase', () => {
  for (const base of [base16, base32, base58btc, base64]) {
    describe(`basics ${base.name}`, () => {
      it('encode/decode', () => {
        const string = base.encode(bytes.fromString('test'))
        assert.deepStrictEqual(string[0], base.prefix)
        const buffer = base.decode(string)
        assert.deepStrictEqual(buffer, bytes.fromString('test'))
      })

      it('pristine backing buffer', () => {
        // some deepEqual() libraries go as deep as the backing buffer, make sure it's pristine
        const string = base.encode(bytes.fromString('test'))
        const buffer = base.decode(string)
        const expected = bytes.fromString('test')
        assert.deepStrictEqual(new Uint8Array(buffer).join(','), new Uint8Array(expected.buffer).join(','))
      })

      it('empty', () => {
        const str = base.encode(bytes.fromString(''))
        assert.deepStrictEqual(str, base.prefix)
        assert.deepStrictEqual(base.decode(str), bytes.fromString(''))
      })

      it('bad chars', () => {
        const str = base.prefix + '#$%^&*&^%$#'
        const msg = `Non-${base.name} character`
        assert.throws(() => base.decode(str), msg)
      })
    })
  }

  it('encode string failure', () => {
    const msg = 'Unknown type, must be binary type'
    // @ts-expect-error - expects bytes
    assert.throws(() => base32.encode('asdf'), msg)
    // @ts-expect-error - expects bytes
    assert.throws(() => base32.encoder.encode('asdf'), msg)
  })

  it('decode int failure', () => {
    const msg = 'Can only multibase decode strings'
    // @ts-expect-error - 'number' is not assignable to parameter of type 'string'
    assert.throws(() => base32.decode(1), msg)
    // @ts-expect-error - 'number' is not assignable to parameter of type 'string'
    assert.throws(() => base32.decoder.decode(1), msg)
  })

  const buff = bytes.fromString('test')
  const nonPrintableBuff = Uint8Array.from([239, 250, 254])

  /**
   * @param {typeof b2|b8|b10|b16|b32|b36|b58|b64} bases
   */
  const baseTest = bases => {
    for (const base of Object.values(bases)) {
      if (base && base.name) {
        it(`encode/decode ${base.name}`, () => {
          const encoded = base.encode(buff)
          const decoded = base.decode(encoded)
          assert.deepStrictEqual(decoded, buff)
          assert.deepStrictEqual(encoded, base.encoder.encode(buff))
          assert.deepStrictEqual(buff, base.decoder.decode(encoded))
        })

        it(`encode/decode ${base.name} with non-printable values`, () => {
          const encoded = base.encode(nonPrintableBuff)
          const decoded = base.decode(encoded)
          assert.deepStrictEqual(decoded, nonPrintableBuff)
          assert.deepStrictEqual(encoded, base.encoder.encode(nonPrintableBuff))
          assert.deepStrictEqual(nonPrintableBuff, base.decoder.decode(encoded))
        })
      }
    }
  }

  describe('base2', () => {
    baseTest(b2)
  })

  describe('base8', () => {
    baseTest(b8)
  })

  describe('base10', () => {
    baseTest(b10)
  })

  describe('base16', () => {
    baseTest(b16)
  })

  describe('base32', () => {
    baseTest(b32)
  })

  describe('base36', () => {
    baseTest(b36)
  })

  describe('base58', () => {
    baseTest(b58)
  })

  describe('base64', () => {
    baseTest(b64)
  })

  it('multibase mismatch', () => {
    const b64 = base64.encode(bytes.fromString('test'))
    const msg = `Unable to decode multibase string "${b64}", base32 decoder only supports inputs prefixed with ${base32.prefix}`
    assert.throws(() => base32.decode(b64), msg)
  })

  it('decoder composition', () => {
    const base = base32.decoder.or(base58btc.decoder)

    const b32 = base32.encode(bytes.fromString('test'))
    assert.deepStrictEqual(base.decode(b32), bytes.fromString('test'))

    const b58 = base58btc.encode(bytes.fromString('test'))
    assert.deepStrictEqual(base.decode(b58), bytes.fromString('test'))

    const b64 = base64.encode(bytes.fromString('test'))
    const msg = `Unable to decode multibase string "${b64}", only inputs prefixed with ${base32.prefix},${base58btc.prefix} are supported`
    assert.throws(() => base.decode(b64), msg)

    const baseExt = base.or(base64)
    assert.deepStrictEqual(baseExt.decode(b64), bytes.fromString('test'))

    // original composition stays intact
    assert.throws(() => base.decode(b64), msg)

    // non-composed combined with composed
    const baseExt2 = base32.decoder.or(base64.decoder.or(base16.decoder))
    assert.deepStrictEqual(baseExt2.decode(b64), bytes.fromString('test'))

    // composed combined with composed
    const baseExt3 = base.or(base64.decoder.or(base16.decoder))
    assert.deepStrictEqual(baseExt3.decode(b64), bytes.fromString('test'))
  })

  it('truncated data', () => {
    const b64 = base64.encode(Uint8Array.from([245, 250]))

    assert.throws(() => base64.decode(b64.substring(0, b64.length - 1)), 'Unexpected end of data')
  })

  it('infers prefix and name corretly', () => {
    /** @type {'base32'} */
    const name = base32.name

    /** @type {'base16'} */
    // @ts-expect-error - TS catches mismatch
    const name2 = base32.name

    /** @type {'b'} */
    const prefix = base32.prefix
    assert.equal(prefix, 'b')
    assert.equal(name, 'base32')
    assert.equal(name2, name)
  })
})
