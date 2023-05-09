import { coerce, equals as equalBytes } from '../bytes.js'
import * as varint from '../varint.js'

/**
 * Creates a multihash digest.
 * @template {number} Code
 * @param {Code} code
 * @param {Uint8Array} digest
 */
export const create = (code, digest) => {
  const size = digest.byteLength
  const sizeOffset = varint.encodingLength(code)
  const digestOffset = sizeOffset + varint.encodingLength(size)

  const bytes = new Uint8Array(digestOffset + size)
  varint.encodeTo(code, bytes, 0)
  varint.encodeTo(size, bytes, sizeOffset)
  bytes.set(digest, digestOffset)

  return new Digest(code, size, digest, bytes)
}

/**
 * Turns bytes representation of multihash digest into an instance.
 * @param {Uint8Array} multihash
 * @returns {MultihashDigest}
 */
export const decode = (multihash) => {
  const bytes = coerce(multihash)
  const [code, sizeOffset] = varint.decode(bytes)
  const [size, digestOffset] = varint.decode(bytes.subarray(sizeOffset))
  const digest = bytes.subarray(sizeOffset + digestOffset)

  if (digest.byteLength !== size) {
    throw new Error('Incorrect length')
  }

  return new Digest(code, size, digest, bytes)
}

/**
 * @param {MultihashDigest} a
 * @param {MultihashDigest} b
 * @returns {boolean}
 */
export const equals = (a, b) => {
  if (a === b) {
    return true
  } else {
    return a.code === b.code && a.size === b.size && equalBytes(a.bytes, b.bytes)
  }
}

/**
 * @typedef {import('./interface').MultihashDigest} MultihashDigest
 */

/**
 * Represents a multihash digest which carries information about the
 * hashing alogrithm and an actual hash digest.
 * @template {number} Code
 * @template {number} Size
 * @class
 * @implements {MultihashDigest}
 */
export class Digest {
  /**
   * Creates a multihash digest.
   * @param {Code} code
   * @param {Size} size
   * @param {Uint8Array} digest
   * @param {Uint8Array} bytes
   */
  constructor (code, size, digest, bytes) {
    this.code = code
    this.size = size
    this.digest = digest
    this.bytes = bytes
  }
}
