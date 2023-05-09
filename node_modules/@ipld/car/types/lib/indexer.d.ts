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
export class CarIndexer implements RootsReader, AsyncIterable<BlockIndex> {
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
    static fromBytes(bytes: Uint8Array): Promise<CarIndexer>;
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
    static fromIterable(asyncIterable: AsyncIterable<Uint8Array>): Promise<CarIndexer>;
    /**
     * @param {number} version
     * @param {CID[]} roots
     * @param {AsyncGenerator<BlockIndex>} iterator
     */
    constructor(version: number, roots: CID[], iterator: AsyncGenerator<BlockIndex>);
    _version: number;
    _roots: import("multiformats").CID[];
    _iterator: AsyncGenerator<import("../api").BlockIndex, any, any>;
    get version(): number;
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
    getRoots(): Promise<CID[]>;
    /**
     * @returns {AsyncIterator<BlockIndex>}
     */
    [Symbol.asyncIterator](): AsyncIterator<BlockIndex>;
}
export type CID = import('multiformats').CID;
export type Block = import('../api').Block;
export type RootsReader = import('../api').RootsReader;
export type BlockIndex = import('../api').BlockIndex;
export type BytesReader = import('./coding').BytesReader;
//# sourceMappingURL=indexer.d.ts.map