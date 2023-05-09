import {
  asyncIterableReader,
  bytesReader,
  createDecoder
} from './decoder.js'

/**
 * @typedef {import('multiformats').CID} CID
 * @typedef {import('../api').Block} Block
 * @typedef {import('../api').RootsReader} RootsReader
 * @typedef {import('../api').BlockIndex} BlockIndex
 * @typedef {import('./coding').BytesReader} BytesReader
 */

/**
 * Provides an iterator over all of the `Block`s in a CAR, returning their CIDs
 * and byte-location information. Implements an `AsyncIterable<BlockIndex>`.
 * Where a `BlockIndex` is a
 * `{ cid:CID, length:number, offset:number, blockLength:number, blockOffset:number }`.
 *
 * As an implementer of `AsyncIterable`, this class can be used directly in a
 * `for await (const blockIndex of iterator) {}` loop. Where the `iterator` is
 * constructed using {@link CarIndexer.fromBytes} or
 * {@link CarIndexer.fromIterable}.
 *
 * An iteration can only be performce _once_ per instantiation.
 *
 * `CarIndexer` also implements the `RootsReader` interface and provides
 * the {@link CarIndexer.getRoots `getRoots()`} method.
 *
 * Load this class with either
 * `import { CarIndexer } from '@ipld/car/indexer'`
 * (`const { CarIndexer } = require('@ipld/car/indexer')`). Or
 * `import { CarIndexer } from '@ipld/car'`
 * (`const { CarIndexer } = require('@ipld/car')`). The former will likely
 * result in smaller bundle sizes where this is important.
 *
 * @name CarIndexer
 * @class
 * @implements {RootsReader}
 * @implements {AsyncIterable<BlockIndex>}
 * @property {number} version The version number of the CAR referenced by this
 * reader (should be `1`).
 */
export class CarIndexer {
  /**
   * @param {number} version
   * @param {CID[]} roots
   * @param {AsyncGenerator<BlockIndex>} iterator
   */
  constructor (version, roots, iterator) {
    this._version = version
    this._roots = roots
    this._iterator = iterator
  }

  get version () {
    return this._version
  }

  /**
   * Get the list of roots defined by the CAR referenced by this indexer. May be
   * zero or more `CID`s.
   *
   * @method
   * @memberof CarIndexer
   * @instance
   * @async
   * @returns {Promise<CID[]>}
   */
  async getRoots () {
    return this._roots
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * @returns {AsyncIterator<BlockIndex>}
   */
  [Symbol.asyncIterator] () {
    return this._iterator
  }

  /**
   * Instantiate a {@link CarIndexer} from a `Uint8Array` blob. Only the header
   * is decoded initially, the remainder is processed and emitted via the
   * iterator as it is consumed.
   *
   * @async
   * @static
   * @memberof CarIndexer
   * @param {Uint8Array} bytes
   * @returns {Promise<CarIndexer>}
   */
  static async fromBytes (bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('fromBytes() requires a Uint8Array')
    }
    return decodeIndexerComplete(bytesReader(bytes))
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * Instantiate a {@link CarIndexer} from a `AsyncIterable<Uint8Array>`,
   * such as a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
   * is decoded initially, the remainder is processed and emitted via the
   * iterator as it is consumed.
   *
   * @async
   * @static
   * @memberof CarIndexer
   * @param {AsyncIterable<Uint8Array>} asyncIterable
   * @returns {Promise<CarIndexer>}
   */
  static async fromIterable (asyncIterable) {
    if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
      throw new TypeError('fromIterable() requires an async iterable')
    }
    return decodeIndexerComplete(asyncIterableReader(asyncIterable))
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }
}

/**
 * @private
 * @param {BytesReader} reader
 * @returns {Promise<CarIndexer>}
 */
async function decodeIndexerComplete (reader) {
  const decoder = createDecoder(reader)
  const { version, roots } = await decoder.header()

  return new CarIndexer(version, roots, decoder.blocksIndex())
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}
