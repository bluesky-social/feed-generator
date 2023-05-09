import {
  asyncIterableReader,
  bytesReader,
  createDecoder
} from './decoder.js';
export class CarReader {
  constructor(version, roots, blocks) {
    this._version = version;
    this._roots = roots;
    this._blocks = blocks;
    this._keys = blocks.map(b => b.cid.toString());
  }
  get version() {
    return this._version;
  }
  async getRoots() {
    return this._roots;
  }
  async has(key) {
    return this._keys.indexOf(key.toString()) > -1;
  }
  async get(key) {
    const index = this._keys.indexOf(key.toString());
    return index > -1 ? this._blocks[index] : undefined;
  }
  async *blocks() {
    for (const block of this._blocks) {
      yield block;
    }
  }
  async *cids() {
    for (const block of this._blocks) {
      yield block.cid;
    }
  }
  static async fromBytes(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('fromBytes() requires a Uint8Array');
    }
    return decodeReaderComplete(bytesReader(bytes));
  }
  static async fromIterable(asyncIterable) {
    if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
      throw new TypeError('fromIterable() requires an async iterable');
    }
    return decodeReaderComplete(asyncIterableReader(asyncIterable));
  }
}
async function decodeReaderComplete(reader) {
  const decoder = createDecoder(reader);
  const {version, roots} = await decoder.header();
  const blocks = [];
  for await (const block of decoder.blocks()) {
    blocks.push(block);
  }
  return new CarReader(version, roots, blocks);
}
export const __browser = true;