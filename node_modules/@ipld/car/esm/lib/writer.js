import fs from 'fs';
import { promisify } from 'util';
import { CarWriter as BrowserCarWriter } from './writer-browser.js';
import {
  readHeader,
  chunkReader
} from './decoder.js';
import { createHeader } from './encoder.js';
const fsread = promisify(fs.read);
const fswrite = promisify(fs.write);
export class CarWriter extends BrowserCarWriter {
  static async updateRootsInFile(fd, roots) {
    const chunkSize = 256;
    let bytes;
    let offset = 0;
    let readChunk;
    if (typeof fd === 'number') {
      readChunk = async () => (await fsread(fd, bytes, 0, chunkSize, offset)).bytesRead;
    } else if (typeof fd === 'object' && typeof fd.read === 'function') {
      readChunk = async () => (await fd.read(bytes, 0, chunkSize, offset)).bytesRead;
    } else {
      throw new TypeError('Bad fd');
    }
    const fdReader = chunkReader(async () => {
      bytes = new Uint8Array(chunkSize);
      const read = await readChunk();
      offset += read;
      return read < chunkSize ? bytes.subarray(0, read) : bytes;
    });
    await readHeader(fdReader);
    const newHeader = createHeader(roots);
    if (fdReader.pos !== newHeader.length) {
      throw new Error(`updateRoots() can only overwrite a header of the same length (old header is ${ fdReader.pos } bytes, new header is ${ newHeader.length } bytes)`);
    }
    if (typeof fd === 'number') {
      await fswrite(fd, newHeader, 0, newHeader.length, 0);
    } else if (typeof fd === 'object' && typeof fd.read === 'function') {
      await fd.write(newHeader, 0, newHeader.length, 0);
    }
  }
}
export const __browser = false;