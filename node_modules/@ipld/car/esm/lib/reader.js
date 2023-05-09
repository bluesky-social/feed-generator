import fs from 'fs';
import { promisify } from 'util';
import { CarReader as BrowserCarReader } from './reader-browser.js';
const fsread = promisify(fs.read);
export class CarReader extends BrowserCarReader {
  static async readRaw(fd, blockIndex) {
    const {cid, blockLength, blockOffset} = blockIndex;
    const bytes = new Uint8Array(blockLength);
    let read;
    if (typeof fd === 'number') {
      read = (await fsread(fd, bytes, 0, blockLength, blockOffset)).bytesRead;
    } else if (typeof fd === 'object' && typeof fd.read === 'function') {
      read = (await fd.read(bytes, 0, blockLength, blockOffset)).bytesRead;
    } else {
      throw new TypeError('Bad fd');
    }
    if (read !== blockLength) {
      throw new Error(`Failed to read entire block (${ read } instead of ${ blockLength })`);
    }
    return {
      cid,
      bytes
    };
  }
}
export const __browser = false;