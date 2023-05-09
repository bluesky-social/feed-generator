/// <reference types="node" />
/**
 * @class
 * @implements {CarReaderIface}
 */
export class CarReader extends BrowserCarReader implements CarReaderIface {
    /**
     * Reads a block directly from a file descriptor for an open CAR file. This
     * function is **only available in Node.js** and not a browser environment.
     *
     * This function can be used in connection with {@link CarIndexer} which emits
     * the `BlockIndex` objects that are required by this function.
     *
     * The user is responsible for opening and closing the file used in this call.
     *
     * @async
     * @static
     * @memberof CarReader
     * @param {fs.promises.FileHandle | number} fd A file descriptor from the
     * Node.js `fs` module. Either an integer, from `fs.open()` or a `FileHandle`
     * from `fs.promises.open()`.
     * @param {BlockIndex} blockIndex An index pointing to the location of the
     * Block required. This `BlockIndex` should take the form:
     * `{cid:CID, blockLength:number, blockOffset:number}`.
     * @returns {Promise<Block>} A `{ cid:CID, bytes:Uint8Array }` pair.
     */
    static readRaw(fd: fs.promises.FileHandle | number, blockIndex: BlockIndex): Promise<Block>;
}
export const __browser: false;
export type Block = import('../api').Block;
export type BlockIndex = import('../api').BlockIndex;
export type CarReaderIface = import('../api').CarReader;
import { CarReader as BrowserCarReader } from "./reader-browser.js";
import fs from "fs";
//# sourceMappingURL=reader.d.ts.map