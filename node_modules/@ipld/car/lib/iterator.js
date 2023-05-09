import {
  asyncIterableReader,
  bytesReader,
  createDecoder
} from './decoder.js'

/**
 * @typedef {import('multiformats').CID} CID
 * @typedef {import('../api').Block} Block
 * @typedef {import('../api').RootsReader} RootsReader
 * @typedef {import('./coding').BytesReader} BytesReader
 */

/**
 * @class
 * @implements {RootsReader}
 * @property {number} version The version number of the CAR referenced by this reader (should be `1`).
 */
export class CarIteratorBase {
  /**
   * @param {number} version
   * @param {CID[]} roots
   * @param {AsyncIterable<Block>|void} iterable
   */
  constructor (version, roots, iterable) {
    this._version = version
    this._roots = roots
    this._iterable = iterable
    this._decoded = false
  }

  get version () {
    return this._version
  }

  /**
   * @returns {Promise<CID[]>}
   */
  async getRoots () {
    return this._roots
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }
}

/**
 * Provides an iterator over all of the `Block`s in a CAR. Implements a
 * `BlockIterator` interface, or `AsyncIterable<Block>`. Where a `Block` is
 * a `{ cid:CID, bytes:Uint8Array }` pair.
 *
 * As an implementer of `AsyncIterable`, this class can be used directly in a
 * `for await (const block of iterator) {}` loop. Where the `iterator` is
 * constructed using {@link CarBlockiterator.fromBytes} or
 * {@link CarBlockiterator.fromIterable}.
 *
 * An iteration can only be performce _once_ per instantiation.
 *
 * `CarBlockIterator` also implements the `RootsReader` interface and provides
 * the {@link CarBlockiterator.getRoots `getRoots()`} method.
 *
 * Load this class with either
 * `import { CarBlockIterator } from '@ipld/car/iterator'`
 * (`const { CarBlockIterator } = require('@ipld/car/iterator')`). Or
 * `import { CarBlockIterator } from '@ipld/car'`
 * (`const { CarBlockIterator } = require('@ipld/car')`).
 *
 * @name CarBlockIterator
 * @class
 * @implements {RootsReader}
 * @implements {AsyncIterable<Block>}
 * @property {number} version The version number of the CAR referenced by this
 * iterator (should be `1`).
 */
export class CarBlockIterator extends CarIteratorBase {
  // inherited method
  /**
   * Get the list of roots defined by the CAR referenced by this iterator. May be
   * zero or more `CID`s.
   *
   * @method getRoots
   * @memberof CarBlockIterator
   * @instance
   * @async
   * @returns {Promise<CID[]>}
   */

  /**
   * @returns {AsyncIterator<Block>}
   */
  [Symbol.asyncIterator] () {
    if (this._decoded) {
      throw new Error('Cannot decode more than once')
    }
    /* c8 ignore next 3 */
    if (!this._iterable) {
      throw new Error('Block iterable not found')
    }
    this._decoded = true
    return this._iterable[Symbol.asyncIterator]()
  }

  /**
   * Instantiate a {@link CarBlockIterator} from a `Uint8Array` blob. Rather
   * than decoding the entire byte array prior to returning the iterator, as in
   * {@link CarReader.fromBytes}, only the header is decoded and the remainder
   * of the CAR is parsed as the `Block`s as yielded.
   *
   * @async
   * @static
   * @memberof CarBlockIterator
   * @param {Uint8Array} bytes
   * @returns {Promise<CarBlockIterator>}
   */
  static async fromBytes (bytes) {
    const { version, roots, iterator } = await fromBytes(bytes)
    return new CarBlockIterator(version, roots, iterator)
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * Instantiate a {@link CarBlockIterator} from a `AsyncIterable<Uint8Array>`,
   * such as a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
   * Rather than decoding the entire byte array prior to returning the iterator,
   * as in {@link CarReader.fromIterable}, only the header is decoded and the
   * remainder of the CAR is parsed as the `Block`s as yielded.
   *
   * @async
   * @static
   * @param {AsyncIterable<Uint8Array>} asyncIterable
   * @returns {Promise<CarBlockIterator>}
   */
  static async fromIterable (asyncIterable) {
    const { version, roots, iterator } = await fromIterable(asyncIterable)
    return new CarBlockIterator(version, roots, iterator)
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }
}

/**
 * Provides an iterator over all of the `CID`s in a CAR. Implements a
 * `CIDIterator` interface, or `AsyncIterable<CID>`. Similar to
 * {@link CarBlockIterator} but only yields the CIDs in the CAR.
 *
 * As an implementer of `AsyncIterable`, this class can be used directly in a
 * `for await (const cid of iterator) {}` loop. Where the `iterator` is
 * constructed using {@link CarCIDiterator.fromBytes} or
 * {@link CarCIDiterator.fromIterable}.
 *
 * An iteration can only be performce _once_ per instantiation.
 *
 * `CarCIDIterator` also implements the `RootsReader` interface and provides
 * the {@link CarCIDiterator.getRoots `getRoots()`} method.
 *
 * Load this class with either
 * `import { CarCIDIterator } from '@ipld/car/iterator'`
 * (`const { CarCIDIterator } = require('@ipld/car/iterator')`). Or
 * `import { CarCIDIterator } from '@ipld/car'`
 * (`const { CarCIDIterator } = require('@ipld/car')`).
 *
 * @name CarCIDIterator
 * @class
 * @implements {RootsReader}
 * @implements {AsyncIterable<CID>}
 * @property {number} version The version number of the CAR referenced by this
 * iterator (should be `1`).
 */
export class CarCIDIterator extends CarIteratorBase {
  // inherited method
  /**
   * Get the list of roots defined by the CAR referenced by this iterator. May be
   * zero or more `CID`s.
   *
   * @method getRoots
   * @memberof CarCIDIterator
   * @instance
   * @async
   * @returns {Promise<CID[]>}
   */

  /**
   * @returns {AsyncIterator<CID>}
   */
  [Symbol.asyncIterator] () {
    if (this._decoded) {
      throw new Error('Cannot decode more than once')
    }
    /* c8 ignore next 3 */
    if (!this._iterable) {
      throw new Error('Block iterable not found')
    }
    this._decoded = true
    const iterable = this._iterable[Symbol.asyncIterator]()
    return {
      async next () {
        const next = await iterable.next()
        if (next.done) {
          return next
        }
        return { done: false, value: next.value.cid }
        /* c8 ignore next 2 */
        // Node.js 12 c8 bug
      }
    }
  }

  /**
   * Instantiate a {@link CarCIDIterator} from a `Uint8Array` blob. Rather
   * than decoding the entire byte array prior to returning the iterator, as in
   * {@link CarReader.fromBytes}, only the header is decoded and the remainder
   * of the CAR is parsed as the `CID`s as yielded.
   *
   * @async
   * @static
   * @memberof CarCIDIterator
   * @param {Uint8Array} bytes
   * @returns {Promise<CarCIDIterator>}
   */
  static async fromBytes (bytes) {
    const { version, roots, iterator } = await fromBytes(bytes)
    return new CarCIDIterator(version, roots, iterator)
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * Instantiate a {@link CarCIDIterator} from a `AsyncIterable<Uint8Array>`,
   * such as a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
   * Rather than decoding the entire byte array prior to returning the iterator,
   * as in {@link CarReader.fromIterable}, only the header is decoded and the
   * remainder of the CAR is parsed as the `CID`s as yielded.
   *
   * @async
   * @static
   * @memberof CarCIDIterator
   * @param {AsyncIterable<Uint8Array>} asyncIterable
   * @returns {Promise<CarCIDIterator>}
   */
  static async fromIterable (asyncIterable) {
    const { version, roots, iterator } = await fromIterable(asyncIterable)
    return new CarCIDIterator(version, roots, iterator)
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }
}

/**
 * @param {Uint8Array} bytes
 * @returns {Promise<{ version:number, roots:CID[], iterator:AsyncIterable<Block>}>}
 */
async function fromBytes (bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('fromBytes() requires a Uint8Array')
  }
  return decodeIterator(bytesReader(bytes))
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {AsyncIterable<Uint8Array>} asyncIterable
 * @returns {Promise<{ version:number, roots:CID[], iterator:AsyncIterable<Block>}>}
 */
async function fromIterable (asyncIterable) {
  if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
    throw new TypeError('fromIterable() requires an async iterable')
  }
  return decodeIterator(asyncIterableReader(asyncIterable))
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @private
 * @param {BytesReader} reader
 * @returns {Promise<{ version:number, roots:CID[], iterator:AsyncIterable<Block>}>}
 */
async function decodeIterator (reader) {
  const decoder = createDecoder(reader)
  const { version, roots } = await decoder.header()
  return { version, roots, iterator: decoder.blocks() }
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}
