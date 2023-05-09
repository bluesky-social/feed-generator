import fs from 'fs';
import { Readable } from 'stream';
import { CID } from 'multiformats/cid';
import { CarIndexer } from './indexer.js';
import { CarReader as NodeCarReader } from './reader.js';
export class CarIndexedReader {
  constructor(version, path, roots, index, order) {
    this._version = version;
    this._path = path;
    this._roots = roots;
    this._index = index;
    this._order = order;
    this._fd = null;
  }
  get version() {
    return this._version;
  }
  async getRoots() {
    return this._roots;
  }
  async has(key) {
    return this._index.has(key.toString());
  }
  async get(key) {
    const blockIndex = this._index.get(key.toString());
    if (!blockIndex) {
      return undefined;
    }
    if (!this._fd) {
      this._fd = await fs.promises.open(this._path, 'r');
    }
    const readIndex = {
      cid: key,
      length: 0,
      offset: 0,
      blockLength: blockIndex.blockLength,
      blockOffset: blockIndex.blockOffset
    };
    return NodeCarReader.readRaw(this._fd, readIndex);
  }
  async *blocks() {
    for (const cidStr of this._order) {
      const block = await this.get(CID.parse(cidStr));
      if (!block) {
        throw new Error('Unexpected internal error');
      }
      yield block;
    }
  }
  async *cids() {
    for (const cidStr of this._order) {
      yield CID.parse(cidStr);
    }
  }
  async close() {
    if (this._fd) {
      return this._fd.close();
    }
  }
  static async fromFile(path) {
    if (typeof path !== 'string') {
      throw new TypeError('fromFile() requires a file path string');
    }
    const iterable = await CarIndexer.fromIterable(Readable.from(fs.createReadStream(path)));
    const index = new Map();
    const order = [];
    for await (const {cid, blockLength, blockOffset} of iterable) {
      const cidStr = cid.toString();
      index.set(cidStr, {
        blockLength,
        blockOffset
      });
      order.push(cidStr);
    }
    return new CarIndexedReader(iterable.version, path, await iterable.getRoots(), index, order);
  }
}
export const __browser = false;