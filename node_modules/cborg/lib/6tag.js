import { Token, Type } from './token.js'
import * as uint from './0uint.js'

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
export function decodeTagCompact (_data, _pos, minor, _options) {
  return new Token(Type.tag, minor, 1)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag8 (data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag16 (data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag32 (data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint32(data, pos + 1, options), 5)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag64 (data, pos, _minor, options) {
  return new Token(Type.tag, uint.readUint64(data, pos + 1, options), 9)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
export function encodeTag (buf, token) {
  uint.encodeUintValue(buf, Type.tag.majorEncoded, token.value)
}

encodeTag.compareTokens = uint.encodeUint.compareTokens

/**
 * @param {Token} token
 * @returns {number}
 */
encodeTag.encodedSize = function encodedSize (token) {
  return uint.encodeUintValue.encodedSize(token.value)
}
