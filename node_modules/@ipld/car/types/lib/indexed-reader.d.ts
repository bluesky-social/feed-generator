/// <reference types="node" />
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
export class CarIndexedReader implements CarReaderIface {
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
    static fromFile(path: string): Promise<CarIndexedReader>;
    /**
     * @param {number} version
     * @param {string} path
     * @param {CID[]} roots
     * @param {Map<string, RawLocation>} index
     * @param {string[]} order
     */
    constructor(version: number, path: string, roots: CID[], index: Map<string, RawLocation>, order: string[]);
    _version: number;
    _path: string;
    _roots: CID[];
    _index: Map<string, RawLocation>;
    _order: string[];
    _fd: fs.promises.FileHandle | null;
    get version(): number;
    /**
     * See {@link CarReader#getRoots}
     *
     * @method
     * @memberof CarIndexedReader
     * @instance
     * @async
     * @returns {Promise<CID[]>}
     */
    getRoots(): Promise<CID[]>;
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
    has(key: CID): Promise<boolean>;
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
    get(key: CID): Promise<Block | undefined>;
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
    blocks(): AsyncGenerator<Block>;
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
    cids(): AsyncGenerator<CID>;
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
    close(): Promise<void>;
}
export const __browser: false;
export type FileHandle = import('fs').promises.FileHandle;
export type Block = import('../api').Block;
export type BlockIndex = import('../api').BlockIndex;
export type CarReaderIface = import('../api').CarReader;
export type CarReader = import('./reader-browser').CarReader;
export type RawLocation = {
    blockLength: number;
    blockOffset: number;
};
import { CID } from "multiformats/cid";
import fs from "fs";
//# sourceMappingURL=indexed-reader.d.ts.map