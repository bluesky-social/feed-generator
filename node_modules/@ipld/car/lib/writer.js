import fs from 'fs'
import { promisify } from 'util'
import { CarWriter as BrowserCarWriter } from './writer-browser.js'
import { readHeader, chunkReader } from './decoder.js'
import { createHeader } from './encoder.js'

const fsread = promisify(fs.read)
const fswrite = promisify(fs.write)

/**
 * @typedef {import('multiformats/cid').CID} CID
 * @typedef {import('../api').BlockWriter} BlockWriter
 */

/**
 * @class
 * @implements {BlockWriter}
 */
export class CarWriter extends BrowserCarWriter {
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
  static async updateRootsInFile (fd, roots) {
    const chunkSize = 256
    /** @type {Uint8Array} */
    let bytes
    let offset = 0

    /** @type {() => Promise<number>} */
    let readChunk
    if (typeof fd === 'number') {
      readChunk = async () => (await fsread(fd, bytes, 0, chunkSize, offset)).bytesRead
    } else if (typeof fd === 'object' && typeof fd.read === 'function') { // FileDescriptor
      readChunk = async () => (await fd.read(bytes, 0, chunkSize, offset)).bytesRead
    } else {
      throw new TypeError('Bad fd')
    }
    const fdReader = chunkReader(async () => {
      bytes = new Uint8Array(chunkSize) // need a new chunk each time, can't reuse old
      const read = await readChunk()
      offset += read
      // TODO: test header > 256 bytes
      // also Node.js 12 c8 bug
      /* c8 ignore next 2 */
      return read < chunkSize ? bytes.subarray(0, read) : bytes
    })

    await readHeader(fdReader)
    const newHeader = createHeader(roots)
    if (fdReader.pos !== newHeader.length) {
      throw new Error(`updateRoots() can only overwrite a header of the same length (old header is ${fdReader.pos} bytes, new header is ${newHeader.length} bytes)`)
    }
    if (typeof fd === 'number') {
      await fswrite(fd, newHeader, 0, newHeader.length, 0)
    } else if (typeof fd === 'object' && typeof fd.read === 'function') { // FileDescriptor
      await fd.write(newHeader, 0, newHeader.length, 0)
    }
  }
}

export const __browser = false
