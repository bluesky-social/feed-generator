import { Token, Type } from './token.js'
import * as uint from './0uint.js'
import * as negint from './1negint.js'
import * as bytes from './2bytes.js'
import * as string from './3string.js'
import * as array from './4array.js'
import * as map from './5map.js'
import * as tag from './6tag.js'
import * as float from './7float.js'
import { decodeErrPrefix } from './common.js'
import { fromArray } from './byte-utils.js'

/**
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 */
function invalidMinor (data, pos, minor) {
  throw new Error(`${decodeErrPrefix} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`)
}

/**
 * @param {string} msg
 * @returns {()=>any}
 */
function errorer (msg) {
  return () => { throw new Error(`${decodeErrPrefix} ${msg}`) }
}

/** @type {((data:Uint8Array, pos:number, minor:number, options?:DecodeOptions) => any)[]} */
export const jump = []

// unsigned integer, 0x00..0x17 (0..23)
for (let i = 0; i <= 0x17; i++) {
  jump[i] = invalidMinor // uint.decodeUintCompact, handled by quick[]
}
jump[0x18] = uint.decodeUint8 // unsigned integer, one-byte uint8_t follows
jump[0x19] = uint.decodeUint16 // unsigned integer, two-byte uint16_t follows
jump[0x1a] = uint.decodeUint32 // unsigned integer, four-byte uint32_t follows
jump[0x1b] = uint.decodeUint64 // unsigned integer, eight-byte uint64_t follows
jump[0x1c] = invalidMinor
jump[0x1d] = invalidMinor
jump[0x1e] = invalidMinor
jump[0x1f] = invalidMinor
// negative integer, -1-0x00..-1-0x17 (-1..-24)
for (let i = 0x20; i <= 0x37; i++) {
  jump[i] = invalidMinor // negintDecode, handled by quick[]
}
jump[0x38] = negint.decodeNegint8 // negative integer, -1-n one-byte uint8_t for n follows
jump[0x39] = negint.decodeNegint16 // negative integer, -1-n two-byte uint16_t for n follows
jump[0x3a] = negint.decodeNegint32 // negative integer, -1-n four-byte uint32_t for follows
jump[0x3b] = negint.decodeNegint64 // negative integer, -1-n eight-byte uint64_t for follows
jump[0x3c] = invalidMinor
jump[0x3d] = invalidMinor
jump[0x3e] = invalidMinor
jump[0x3f] = invalidMinor
// byte string, 0x00..0x17 bytes follow
for (let i = 0x40; i <= 0x57; i++) {
  jump[i] = bytes.decodeBytesCompact
}
jump[0x58] = bytes.decodeBytes8 // byte string, one-byte uint8_t for n, and then n bytes follow
jump[0x59] = bytes.decodeBytes16 // byte string, two-byte uint16_t for n, and then n bytes follow
jump[0x5a] = bytes.decodeBytes32 // byte string, four-byte uint32_t for n, and then n bytes follow
jump[0x5b] = bytes.decodeBytes64 // byte string, eight-byte uint64_t for n, and then n bytes follow
jump[0x5c] = invalidMinor
jump[0x5d] = invalidMinor
jump[0x5e] = invalidMinor
jump[0x5f] = errorer('indefinite length bytes/strings are not supported') // byte string, byte strings follow, terminated by "break"
// UTF-8 string 0x00..0x17 bytes follow
for (let i = 0x60; i <= 0x77; i++) {
  jump[i] = string.decodeStringCompact
}
jump[0x78] = string.decodeString8 // UTF-8 string, one-byte uint8_t for n, and then n bytes follow
jump[0x79] = string.decodeString16 // UTF-8 string, two-byte uint16_t for n, and then n bytes follow
jump[0x7a] = string.decodeString32 // UTF-8 string, four-byte uint32_t for n, and then n bytes follow
jump[0x7b] = string.decodeString64 // UTF-8 string, eight-byte uint64_t for n, and then n bytes follow
jump[0x7c] = invalidMinor
jump[0x7d] = invalidMinor
jump[0x7e] = invalidMinor
jump[0x7f] = errorer('indefinite length bytes/strings are not supported') // UTF-8 strings follow, terminated by "break"
// array, 0x00..0x17 data items follow
for (let i = 0x80; i <= 0x97; i++) {
  jump[i] = array.decodeArrayCompact
}
jump[0x98] = array.decodeArray8 // array, one-byte uint8_t for n, and then n data items follow
jump[0x99] = array.decodeArray16 // array, two-byte uint16_t for n, and then n data items follow
jump[0x9a] = array.decodeArray32 // array, four-byte uint32_t for n, and then n data items follow
jump[0x9b] = array.decodeArray64 // array, eight-byte uint64_t for n, and then n data items follow
jump[0x9c] = invalidMinor
jump[0x9d] = invalidMinor
jump[0x9e] = invalidMinor
jump[0x9f] = array.decodeArrayIndefinite // array, data items follow, terminated by "break"
// map, 0x00..0x17 pairs of data items follow
for (let i = 0xa0; i <= 0xb7; i++) {
  jump[i] = map.decodeMapCompact
}
jump[0xb8] = map.decodeMap8 // map, one-byte uint8_t for n, and then n pairs of data items follow
jump[0xb9] = map.decodeMap16 // map, two-byte uint16_t for n, and then n pairs of data items follow
jump[0xba] = map.decodeMap32 // map, four-byte uint32_t for n, and then n pairs of data items follow
jump[0xbb] = map.decodeMap64 // map, eight-byte uint64_t for n, and then n pairs of data items follow
jump[0xbc] = invalidMinor
jump[0xbd] = invalidMinor
jump[0xbe] = invalidMinor
jump[0xbf] = map.decodeMapIndefinite // map, pairs of data items follow, terminated by "break"
// tags
for (let i = 0xc0; i <= 0xd7; i++) {
  jump[i] = tag.decodeTagCompact
}
jump[0xd8] = tag.decodeTag8
jump[0xd9] = tag.decodeTag16
jump[0xda] = tag.decodeTag32
jump[0xdb] = tag.decodeTag64
jump[0xdc] = invalidMinor
jump[0xdd] = invalidMinor
jump[0xde] = invalidMinor
jump[0xdf] = invalidMinor
// 0xe0..0xf3 simple values, unsupported
for (let i = 0xe0; i <= 0xf3; i++) {
  jump[i] = errorer('simple values are not supported')
}
jump[0xf4] = invalidMinor // false, handled by quick[]
jump[0xf5] = invalidMinor // true, handled by quick[]
jump[0xf6] = invalidMinor // null, handled by quick[]
jump[0xf7] = float.decodeUndefined // undefined
jump[0xf8] = errorer('simple values are not supported') // simple value, one byte follows, unsupported
jump[0xf9] = float.decodeFloat16 // half-precision float (two-byte IEEE 754)
jump[0xfa] = float.decodeFloat32 // single-precision float (four-byte IEEE 754)
jump[0xfb] = float.decodeFloat64 // double-precision float (eight-byte IEEE 754)
jump[0xfc] = invalidMinor
jump[0xfd] = invalidMinor
jump[0xfe] = invalidMinor
jump[0xff] = float.decodeBreak // "break" stop code

/** @type {Token[]} */
export const quick = []
// ints <24
for (let i = 0; i < 24; i++) {
  quick[i] = new Token(Type.uint, i, 1)
}
// negints >= -24
for (let i = -1; i >= -24; i--) {
  quick[31 - i] = new Token(Type.negint, i, 1)
}
// empty bytes
quick[0x40] = new Token(Type.bytes, new Uint8Array(0), 1)
// empty string
quick[0x60] = new Token(Type.string, '', 1)
// empty list
quick[0x80] = new Token(Type.array, 0, 1)
// empty map
quick[0xa0] = new Token(Type.map, 0, 1)
// false
quick[0xf4] = new Token(Type.false, false, 1)
// true
quick[0xf5] = new Token(Type.true, true, 1)
// null
quick[0xf6] = new Token(Type.null, null, 1)

/**
 * @param {Token} token
 * @returns {Uint8Array|undefined}
 */
export function quickEncodeToken (token) {
  switch (token.type) {
    case Type.false:
      return fromArray([0xf4])
    case Type.true:
      return fromArray([0xf5])
    case Type.null:
      return fromArray([0xf6])
    case Type.bytes:
      if (!token.value.length) {
        return fromArray([0x40])
      }
      return
    case Type.string:
      if (token.value === '') {
        return fromArray([0x60])
      }
      return
    case Type.array:
      if (token.value === 0) {
        return fromArray([0x80])
      }
      /* c8 ignore next 2 */
      // shouldn't be possible if this were called when there was only one token
      return
    case Type.map:
      if (token.value === 0) {
        return fromArray([0xa0])
      }
      /* c8 ignore next 2 */
      // shouldn't be possible if this were called when there was only one token
      return
    case Type.uint:
      if (token.value < 24) {
        return fromArray([Number(token.value)])
      }
      return
    case Type.negint:
      if (token.value >= -24) {
        return fromArray([31 - Number(token.value)])
      }
  }
}
