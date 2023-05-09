/// <reference types="node" />
/**
 * @typedef {import('multiformats/cid').CID} CID
 * @typedef {import('../api').BlockWriter} BlockWriter
 */
/**
 * @class
 * @implements {BlockWriter}
 */
export class CarWriter extends BrowserCarWriter implements BlockWriter {
    /**
     * Update the list of roots in the header of an existing CAR file. The first
     * argument must be a file descriptor for CAR file that is open in read and
     * write mode (not append), e.g. `fs.open` or `fs.promises.open` with `'r+'`
     * mode.
     *
     * This operation is an _overwrite_, the total length of the CAR will not be
     * modified. A rejection will occur if the new header will not be the same
     * length as the existing header, in which case the CAR will not be modified.
     * It is the responsibility of the user to ensure that the roots being
     * replaced encode as the same length as the new roots.
     *
     * This function is **only available in Node.js** and not a browser
     * environment.
     *
     * @async
     * @static
     * @memberof CarWriter
     * @param {fs.promises.FileHandle | number} fd A file descriptor from the
     * Node.js `fs` module. Either an integer, from `fs.open()` or a `FileHandle`
     * from `fs.promises.open()`.
     * @param {CID[]} roots A new list of roots to replace the existing list in
     * the CAR header. The new header must take up the same number of bytes as the
     * existing header, so the roots should collectively be the same byte length
     * as the existing roots.
     * @returns {Promise<void>}
     */
    static updateRootsInFile(fd: fs.promises.FileHandle | number, roots: CID[]): Promise<void>;
}
export const __browser: false;
export type CID = import('multiformats/cid').CID;
export type BlockWriter = import('../api').BlockWriter;
import { CarWriter as BrowserCarWriter } from "./writer-browser.js";
import fs from "fs";
//# sourceMappingURL=writer.d.ts.map