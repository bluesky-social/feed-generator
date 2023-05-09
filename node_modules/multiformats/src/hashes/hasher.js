import * as Digest from './digest.js'

/**
 * @template {string} Name
 * @template {number} Code
 * @param {Object} options
 * @param {Name} options.name
 * @param {Code} options.code
 * @param {(input: Uint8Array) => Await<Uint8Array>} options.encode
 */
export const from = ({ name, code, encode }) => new Hasher(name, code, encode)

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 *
 * @template {string} Name
 * @template {number} Code
 * @class
 * @implements {MultihashHasher<Code>}
 */
export class Hasher {
  /**
   *
   * @param {Name} name
   * @param {Code} code
   * @param {(input: Uint8Array) => Await<Uint8Array>} encode
   */
  constructor (name, code, encode) {
    this.name = name
    this.code = code
    this.encode = encode
  }

  /**
   * @param {Uint8Array} input
   * @returns {Await<Digest.Digest<Code, number>>}
   */
  digest (input) {
    if (input instanceof Uint8Array) {
      const result = this.encode(input)
      return result instanceof Uint8Array
        ? Digest.create(this.code, result)
        /* c8 ignore next 1 */
        : result.then(digest => Digest.create(this.code, digest))
    } else {
      throw Error('Unknown type, must be binary type')
      /* c8 ignore next 1 */
    }
  }
}

/**
 * @template {number} Alg
 * @typedef {import('./interface').MultihashHasher} MultihashHasher
 */

/**
 * @template T
 * @typedef {Promise<T>|T} Await
 */
