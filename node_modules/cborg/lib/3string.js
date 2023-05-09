import { Token, Type } from './token.js'
import { assertEnoughData, decodeErrPrefix } from './common.js'
import * as uint from './0uint.js'
import { encodeBytes } from './2bytes.js'
import { toString, slice } from './byte-utils.js'

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} prefix
 * @param {number} length
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function toToken (data, pos, prefix, length, options) {
  const totLength = prefix + length
  assertEnoughData(data, pos, totLength)
  const tok = new Token(Type.string, toString(data, pos + prefix, pos + totLength), totLength)
  if (options.retainStringBytes === true) {
    tok.byteValue = slice(data, pos + prefix, pos + totLength)
  }
  return tok
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeStringCompact (data, pos, minor, options) {
  return toToken(data, pos, 1, minor, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeString8 (data, pos, _minor, options) {
  return toToken(data, pos, 2, uint.readUint8(data, pos + 1, options), options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeString16 (data, pos, _minor, options) {
  return toToken(data, pos, 3, uint.readUint16(data, pos + 1, options), options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeString32 (data, pos, _minor, options) {
  return toToken(data, pos, 5, uint.readUint32(data, pos + 1, options), options)
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeString64 (data, pos, _minor, options) {
  const l = uint.readUint64(data, pos + 1, options)
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer string lengths not supported`)
  }
  return toToken(data, pos, 9, l, options)
}

export const encodeString = encodeBytes
