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
export class CarWriter implements BlockWriter {
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
    static create(roots: CID[] | CID | void): WriterChannel;
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
    static createAppender(): WriterChannel;
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
    static updateRootsInBytes(bytes: Uint8Array, roots: CID[]): Promise<Uint8Array>;
    /**
     * @param {CID[]} roots
     * @param {CarEncoder} encoder
     */
    constructor(roots: CID[], encoder: CarEncoder);
    _encoder: import("./coding").CarEncoder;
    /** @type {Promise<void>} */
    _mutex: Promise<void>;
    _ended: boolean;
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
    put(block: Block): Promise<void>;
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
    close(): Promise<void>;
}
/**
 * @class
 * @implements {AsyncIterable<Uint8Array>}
 */
export class CarWriterOut implements AsyncIterable<Uint8Array> {
    /**
     * @param {AsyncIterator<Uint8Array>} iterator
     */
    constructor(iterator: AsyncIterator<Uint8Array>);
    _iterator: AsyncIterator<Uint8Array, any, undefined>;
    _iterating: boolean | undefined;
    [Symbol.asyncIterator](): AsyncIterator<Uint8Array, any, undefined>;
}
export const __browser: true;
export type Block = import('../api').Block;
export type BlockWriter = import('../api').BlockWriter;
export type WriterChannel = import('../api').WriterChannel;
export type CarEncoder = import('./coding').CarEncoder;
export type IteratorChannel = import('./coding').IteratorChannel<Uint8Array>;
import { CID } from "multiformats/cid";
//# sourceMappingURL=writer-browser.d.ts.map