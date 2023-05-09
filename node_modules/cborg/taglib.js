import { Token, Type } from './cborg.js'

/*
A collection of some standard CBOR tags.

There are no tags included by default in the cborg encoder or decoder, you have
to include them by passing options. `typeEncoders` for encode() and `tags` for
decode().

The encoders here can be included with these options (see the tests for how this
can be done), or as examples for writing additional tags. Additional standard
(and reasonable) tags may be added here by pull request.
*/

/* TAG(2) Bignums https://tools.ietf.org/html/rfc8949#section-3.4.3 */
const neg1b = BigInt(-1)
const pos1b = BigInt(1)
const zerob = BigInt(0)
// const twob = BigInt(2)
const eightb = BigInt(8)

/**
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
export function bigIntDecoder (bytes) {
  // TODO: assert that `bytes` is a `Uint8Array`
  let bi = zerob
  for (let ii = 0; ii < bytes.length; ii++) {
    bi = (bi << eightb) + BigInt(bytes[ii])
  }
  return bi
}

/**
 * @param {bigint} bi
 * @returns {Uint8Array}
 */
function fromBigInt (bi) {
  const buf = []
  while (bi > 0) {
    buf.unshift(Number(bi) & 0xff)
    bi >>= eightb
  }
  return Uint8Array.from(buf)
}

// assuming that we're receiving a BigInt here, it should be registered for
// type 'bigint' for this to work.
const maxSafeBigInt = BigInt('18446744073709551615') // (twob ** BigInt(64)) - pos1b
const minSafeBigInt = BigInt('-18446744073709551616') // neg1b * (twob ** BigInt(64))
/**
 * @param {bigint} obj
 * @returns {Token[]|null}
 */
export function bigIntEncoder (obj) {
  if (obj >= minSafeBigInt && obj <= maxSafeBigInt) {
    return null // null = do it the standard way
  }
  return [
    new Token(Type.tag, obj >= zerob ? 2 : 3),
    new Token(Type.bytes, fromBigInt(obj >= zerob ? obj : obj * neg1b - pos1b))
  ]
}

/**
 * TAG(3) Negative Bignums https://tools.ietf.org/html/rfc8949#section-3.4.3
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
export function bigNegIntDecoder (bytes) {
  return neg1b - bigIntDecoder(bytes)
}
