import { Token, Type } from './token.js'
import * as uint from './0uint.js'
import { decodeErrPrefix } from './common.js'

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken (_data, _pos, prefix, length) {
  return new Token(Type.array, length, prefix)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
export function decodeArrayCompact (data, pos, minor, _options) {
  return toToken(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray8 (data, pos, _minor, options) {
  return toToken(data, pos, 2, uint.readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray16 (data, pos, _minor, options) {
  return toToken(data, pos, 3, uint.readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray32 (data, pos, _minor, options) {
  return toToken(data, pos, 5, uint.readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray64 (data, pos, _minor, options) {
  const l = uint.readUint64(data, pos + 1, options)
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer array lengths not supported`)
  }
  return toToken(data, pos, 9, l)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArrayIndefinite (data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return toToken(data, pos, 1, Infinity)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
export function encodeArray (buf, token) {
  uint.encodeUintValue(buf, Type.array.majorEncoded, token.value)
}

// using an array as a map key, are you sure about this? we can only sort
// by map length here, it's up to the encoder to decide to look deeper
encodeArray.compareTokens = uint.encodeUint.compareTokens

/**
 * @param {Token} token
 * @returns {number}
 */
encodeArray.encodedSize = function encodedSize (token) {
  return uint.encodeUintValue.encodedSize(token.value)
}
