import { CID } from 'multiformats/cid'
import { createEncoder, createHeader } from './encoder.js'
import { create as iteratorChannel } from './iterator-channel.js'
import { bytesReader, readHeader } from './decoder.js'

/**
 * @typedef {import('../api').Block} Block
 * @typedef {import('../api').BlockWriter} BlockWriter
 * @typedef {import('../api').WriterChannel} WriterChannel
 * @typedef {import('./coding').CarEncoder} CarEncoder
 * @typedef {import('./coding').IteratorChannel<Uint8Array>} IteratorChannel
 */

/**
 * Provides a writer interface for the creation of CAR files.
 *
 * Creation of a `CarWriter` involves the instatiation of an input / output pair
 * in the form of a `WriterChannel`, which is a
 * `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair. These two
 * components form what can be thought of as a stream-like interface. The
 * `writer` component (an instantiated `CarWriter`), has methods to
 * {@link CarWriter.put `put()`} new blocks and {@link CarWriter.put `close()`}
 * the writing operation (finalising the CAR archive). The `out` component is
 * an `AsyncIterable` that yields the bytes of the archive. This can be
 * redirected to a file or other sink. In Node.js, you can use the
 * [`Readable.from()`](https://nodejs.org/api/stream.html#stream_stream_readable_from_iterable_options)
 * API to convert this to a standard Node.js stream, or it can be directly fed
 * to a
 * [`stream.pipeline()`](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback).
 *
 * The channel will provide a form of backpressure. The `Promise` from a
 * `write()` won't resolve until the resulting data is drained from the `out`
 * iterable.
 *
 * It is also possible to ignore the `Promise` from `write()` calls and allow
 * the generated data to queue in memory. This should be avoided for large CAR
 * archives of course due to the memory costs and potential for memory overflow.
 *
 * Load this class with either
 * `import { CarWriter } from '@ipld/car/writer'`
 * (`const { CarWriter } = require('@ipld/car/writer')`). Or
 * `import { CarWriter } from '@ipld/car'`
 * (`const { CarWriter } = require('@ipld/car')`). The former will likely
 * result in smaller bundle sizes where this is important.
 *
 * @name CarWriter
 * @class
 * @implements {BlockWriter}
 */
export class CarWriter {
  /**
   * @param {CID[]} roots
   * @param {CarEncoder} encoder
   */
  constructor (roots, encoder) {
    this._encoder = encoder
    /** @type {Promise<void>} */
    this._mutex = encoder.setRoots(roots)
    this._ended = false
  }

  /**
   * Write a `Block` (a `{ cid:CID, bytes:Uint8Array }` pair) to the archive.
   *
   * @method
   * @memberof CarWriter
   * @instance
   * @async
   * @param {Block} block A `{ cid:CID, bytes:Uint8Array }` pair.
   * @returns {Promise<void>} The returned promise will only resolve once the
   * bytes this block generates are written to the `out` iterable.
   */
  async put (block) {
    if (!(block.bytes instanceof Uint8Array) || !block.cid) {
      throw new TypeError('Can only write {cid, bytes} objects')
    }
    if (this._ended) {
      throw new Error('Already closed')
    }
    const cid = CID.asCID(block.cid)
    if (!cid) {
      throw new TypeError('Can only write {cid, bytes} objects')
    }
    this._mutex = this._mutex.then(() => this._encoder.writeBlock({ cid, bytes: block.bytes }))
    return this._mutex
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * Finalise the CAR archive and signal that the `out` iterable should end once
   * any remaining bytes are written.
   *
   * @method
   * @memberof CarWriter
   * @instance
   * @async
   * @returns {Promise<void>}
   */
  async close () {
    if (this._ended) {
      throw new Error('Already closed')
    }
    await this._mutex
    this._ended = true
    return this._encoder.close()
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  /**
   * Create a new CAR writer "channel" which consists of a
   * `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair.
   *
   * @async
   * @static
   * @memberof CarWriter
   * @param {CID[] | CID | void} roots
   * @returns {WriterChannel} The channel takes the form of
   * `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }`.
   */
  static create (roots) {
    roots = toRoots(roots)
    const { encoder, iterator } = encodeWriter()
    const writer = new CarWriter(roots, encoder)
    const out = new CarWriterOut(iterator)
    return { writer, out }
  }

  /**
   * Create a new CAR appender "channel" which consists of a
   * `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair.
   * This appender does not consider roots and does not produce a CAR header.
   * It is designed to append blocks to an _existing_ CAR archive. It is
   * expected that `out` will be concatenated onto the end of an existing
   * archive that already has a properly formatted header.
   *
   * @async
   * @static
   * @memberof CarWriter
   * @returns {WriterChannel} The channel takes the form of
   * `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }`.
   */
  static createAppender () {
    const { encoder, iterator } = encodeWriter()
    encoder.setRoots = () => Promise.resolve()
    const writer = new CarWriter([], encoder)
    const out = new CarWriterOut(iterator)
    return { writer, out }
  }

  /**
   * Update the list of roots in the header of an existing CAR as represented
   * in a Uint8Array.
   *
   * This operation is an _overwrite_, the total length of the CAR will not be
   * modified. A rejection will occur if the new header will not be the same
   * length as the existing header, in which case the CAR will not be modified.
   * It is the responsibility of the user to ensure that the roots being
   * replaced encode as the same length as the new roots.
   *
   * The byte array passed in an argument will be modified and also returned
   * upon successful modification.
   *
   * @async
   * @static
   * @memberof CarWriter
   * @param {Uint8Array} bytes
   * @param {CID[]} roots A new list of roots to replace the existing list in
   * the CAR header. The new header must take up the same number of bytes as the
   * existing header, so the roots should collectively be the same byte length
   * as the existing roots.
   * @returns {Promise<Uint8Array>}
   */
  static async updateRootsInBytes (bytes, roots) {
    const reader = bytesReader(bytes)
    await readHeader(reader)
    const newHeader = createHeader(roots)
    if (reader.pos !== newHeader.length) {
      throw new Error(`updateRoots() can only overwrite a header of the same length (old header is ${reader.pos} bytes, new header is ${newHeader.length} bytes)`)
    }
    bytes.set(newHeader, 0)
    return bytes
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }
}

/**
 * @class
 * @implements {AsyncIterable<Uint8Array>}
 */
export class CarWriterOut {
  /**
   * @param {AsyncIterator<Uint8Array>} iterator
   */
  constructor (iterator) {
    this._iterator = iterator
  }

  [Symbol.asyncIterator] () {
    if (this._iterating) {
      throw new Error('Multiple iterator not supported')
    }
    this._iterating = true
    return this._iterator
  }
}

function encodeWriter () {
  /** @type {IteratorChannel} */
  const iw = iteratorChannel()
  const { writer, iterator } = iw
  const encoder = createEncoder(writer)
  return { encoder, iterator }
}

/**
 * @private
 * @param {CID[] | CID | void} roots
 * @returns {CID[]}
 */
function toRoots (roots) {
  if (roots === undefined) {
    return []
  }

  if (!Array.isArray(roots)) {
    const cid = CID.asCID(roots)
    if (!cid) {
      throw new TypeError('roots must be a single CID or an array of CIDs')
    }
    return [cid]
  }

  const _roots = []
  for (const root of roots) {
    const _root = CID.asCID(root)
    if (!_root) {
      throw new TypeError('roots must be a single CID or an array of CIDs')
    }
    _roots.push(_root)
  }
  return _roots
}

export const __browser = true
