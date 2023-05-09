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
export class CarIteratorBase implements RootsReader {
    /**
     * @param {number} version
     * @param {CID[]} roots
     * @param {AsyncIterable<Block>|void} iterable
     */
    constructor(version: number, roots: CID[], iterable: AsyncIterable<Block> | void);
    _version: number;
    _roots: import("multiformats").CID[];
    _iterable: void | AsyncIterable<import("../api").Block>;
    _decoded: boolean;
    get version(): number;
    /**
     * @returns {Promise<CID[]>}
     */
    getRoots(): Promise<CID[]>;
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
export class CarBlockIterator extends CarIteratorBase implements RootsReader, AsyncIterable<Block> {
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
    static fromBytes(bytes: Uint8Array): Promise<CarBlockIterator>;
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
    static fromIterable(asyncIterable: AsyncIterable<Uint8Array>): Promise<CarBlockIterator>;
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
    [Symbol.asyncIterator](): AsyncIterator<Block>;
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
export class CarCIDIterator extends CarIteratorBase implements RootsReader, AsyncIterable<CID> {
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
    static fromBytes(bytes: Uint8Array): Promise<CarCIDIterator>;
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
    static fromIterable(asyncIterable: AsyncIterable<Uint8Array>): Promise<CarCIDIterator>;
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
    [Symbol.asyncIterator](): AsyncIterator<CID>;
}
export type CID = import('multiformats').CID;
export type Block = import('../api').Block;
export type RootsReader = import('../api').RootsReader;
export type BytesReader = import('./coding').BytesReader;
//# sourceMappingURL=iterator.d.ts.map