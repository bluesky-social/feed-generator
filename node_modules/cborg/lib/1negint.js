/* eslint-env es2020 */

import { Token, Type } from './token.js'
import * as uint from './0uint.js'
import { decodeErrPrefix } from './common.js'

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeNegint8 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - uint.readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeNegint16 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - uint.readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeNegint32 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - uint.readUint32(data, pos + 1, options), 5)
}

const neg1b = BigInt(-1)
const pos1b = BigInt(1)

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeNegint64 (data, pos, _minor, options) {
  const int = uint.readUint64(data, pos + 1, options)
  if (typeof int !== 'bigint') {
    const value = -1 - int
    if (value >= Number.MIN_SAFE_INTEGER) {
      return new Token(Type.negint, value, 9)
    }
  }
  if (options.allowBigInt !== true) {
    throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`)
  }
  return new Token(Type.negint, neg1b - BigInt(int), 9)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
export function encodeNegint (buf, token) {
  const negint = token.value
  const unsigned = (typeof negint === 'bigint' ? (negint * neg1b - pos1b) : (negint * -1 - 1))
  uint.encodeUintValue(buf, token.type.majorEncoded, unsigned)
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeNegint.encodedSize = function encodedSize (token) {
  const negint = token.value
  const unsigned = (typeof negint === 'bigint' ? (negint * neg1b - pos1b) : (negint * -1 - 1))
  /* c8 ignore next 4 */
  // handled by quickEncode, we shouldn't get here but it's included for completeness
  if (unsigned < uint.uintBoundaries[0]) {
    return 1
  }
  if (unsigned < uint.uintBoundaries[1]) {
    return 2
  }
  if (unsigned < uint.uintBoundaries[2]) {
    return 3
  }
  if (unsigned < uint.uintBoundaries[3]) {
    return 5
  }
  return 9
}

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeNegint.compareTokens = function compareTokens (tok1, tok2) {
  // opposite of the uint comparison since we store the uint version in bytes
  return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : /* c8 ignore next */ 0
}
