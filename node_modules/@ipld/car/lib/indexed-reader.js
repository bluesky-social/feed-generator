import fs from 'fs'
import { Readable } from 'stream'
import { CID } from 'multiformats/cid'
import { CarIndexer } from './indexer.js'
import { CarReader as NodeCarReader } from './reader.js'

/**
 * @typedef {import('fs').promises.FileHandle} FileHandle
 * @typedef {import('../api').Block} Block
 * @typedef {import('../api').BlockIndex} BlockIndex
 * @typedef {import('../api').CarReader} CarReaderIface
 * @typedef {import('./reader-browser').CarReader} CarReader
 * @typedef {{ blockLength:number, blockOffset:number }} RawLocation
 */

/**
 * A form of {@link CarReader} that pre-indexes a CAR archive from a file and
 * provides random access to blocks within the file using the index data. This
 * function is **only available in Node.js** and not a browser environment.
 *
 * For large CAR files, using this form of `CarReader` can be singificantly more
 * efficient in terms of memory. The index consists of a list of `CID`s and
 * their location within the archive (see {@link CarIndexer}). For large numbers
 * of blocks, this index can also occupy a significant amount of memory. In some
 * cases it may be necessary to expand the memory capacity of a Node.js instance
 * to allow this index to fit. (e.g. by running with
 * `NODE_OPTIONS="--max-old-space-size=16384"`).
 *
 * As an `CarIndexedReader` instance maintains an open file descriptor for its
 * CAR file, an additional {@link CarReader#close} method is attached. This
 * _must_ be called to have full clean-up of resources after use.
 *
 * Load this class with either
 * `import { CarIndexedReader } from '@ipld/car/indexed-reader'`
 * (`const { CarIndexedReader } = require('@ipld/car/indexed-reader')`). Or
 * `import { CarIndexedReader } from '@ipld/car'`
 * (`const { CarIndexedReader } = require('@ipld/car')`). The former will likely
 * result in smaller bundle sizes where this is important.
 *
 * @name CarIndexedReader
 * @class
 * @implements {CarReaderIface}
 * @extends {CarReader}
 * @property {number} version The version number of the CAR referenced by this
 * reader (should be `1`).
 */
export class CarIndexedReader {
  /**
   * @param {number} version
   * @param {string} path
   * @param {CID[]} roots
   * @param {Map<string, RawLocation>} index
   * @param {string[]} order
   */
  constructor (version, path, roots, index, order) {
    this._version = version
    this._path = path
    this._roots = roots
    this._index = index
    this._order = order
    this._fd = null
  }

  get version () {
    return this._version
  }

  /**
   * See {@link CarReader#getRoots}
   *
   * @method
   * @memberof CarIndexedReader
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
   * See {@link CarReader#has}
   *
   * @method
   * @memberof CarIndexedReader
   * @instance
   * @async
   * @param {CID} key
   * @returns {Promise<boolean>}
   */
  async has (key) {
    return this._index.has(key.toString())
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * See {@link CarReader#get}
   *
   * @method
   * @memberof CarIndexedReader
   * @instance
   * @async
   * @param {CID} key
   * @returns {Promise<Block | undefined>}
   */
  async get (key) {
    const blockIndex = this._index.get(key.toString())
    if (!blockIndex) {
      return undefined
    }
    if (!this._fd) {
      this._fd = await fs.promises.open(this._path, 'r')
    }
    const readIndex = {
      cid: key,
      length: 0,
      offset: 0,
      blockLength: blockIndex.blockLength,
      blockOffset: blockIndex.blockOffset
    }
    return NodeCarReader.readRaw(this._fd, readIndex)
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * See {@link CarReader#blocks}
   *
   * @method
   * @memberof CarIndexedReader
   * @instance
   * @async
   * @generator
   * @returns {AsyncGenerator<Block>}
   */
  async * blocks () {
    for (const cidStr of this._order) {
      const block = await this.get(CID.parse(cidStr))
      /* c8 ignore next 3 */
      if (!block) {
        throw new Error('Unexpected internal error')
      }
      yield block
    }
  }

  /**
   * See {@link CarReader#cids}
   *
   * @method
   * @memberof CarIndexedReader
   * @instance
   * @async
   * @generator
   * @returns {AsyncGenerator<CID>}
   */
  async * cids () {
    for (const cidStr of this._order) {
      yield CID.parse(cidStr)
    }
  }

  /**
   * Close the underlying file descriptor maintained by this `CarIndexedReader`.
   * This must be called for proper resource clean-up to occur.
   *
   * @method
   * @memberof CarIndexedReader
   * @instance
   * @async
   * @returns {Promise<void>}
   */
  async close () {
    if (this._fd) {
      return this._fd.close()
    }
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * Instantiate an {@link CarIndexedReader} from a file with the provided
   * `path`. The CAR file is first indexed with a full path that collects `CID`s
   * and block locations. This index is maintained in memory. Subsequent reads
   * operate on a read-only file descriptor, fetching the block from its in-file
   * location.
   *
   * For large archives, the initial indexing may take some time. The returned
   * `Promise` will resolve only after this is complete.
   *
   * @async
   * @static
   * @memberof CarIndexedReader
   * @param {string} path
   * @returns {Promise<CarIndexedReader>}
   */
  static async fromFile (path) {
    if (typeof path !== 'string') {
      throw new TypeError('fromFile() requires a file path string')
    }

    const iterable = await CarIndexer.fromIterable(Readable.from(fs.createReadStream(path)))
    /** @type {Map<string, RawLocation>} */
    const index = new Map()
    /** @type {string[]} */
    const order = []
    for await (const { cid, blockLength, blockOffset } of iterable) {
      const cidStr = cid.toString()
      index.set(cidStr, { blockLength, blockOffset })
      order.push(cidStr)
    }
    return new CarIndexedReader(iterable.version, path, await iterable.getRoots(), index, order)
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }
}

export const __browser = false
