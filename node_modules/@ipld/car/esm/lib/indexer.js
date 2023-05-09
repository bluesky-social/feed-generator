import {
  asyncIterableReader,
  bytesReader,
  createDecoder
} from './decoder.js';
export class CarIndexer {
  constructor(version, roots, iterator) {
    this._version = version;
    this._roots = roots;
    this._iterator = iterator;
  }
  get version() {
    return this._version;
  }
  async getRoots() {
    return this._roots;
  }
  [Symbol.asyncIterator]() {
    return this._iterator;
  }
  static async fromBytes(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('fromBytes() requires a Uint8Array');
    }
    return decodeIndexerComplete(bytesReader(bytes));
  }
  static async fromIterable(asyncIterable) {
    if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
      throw new TypeError('fromIterable() requires an async iterable');
    }
    return decodeIndexerComplete(asyncIterableReader(asyncIterable));
  }
}
async function decodeIndexerComplete(reader) {
  const decoder = createDecoder(reader);
  const {version, roots} = await decoder.header();
  return new CarIndexer(version, roots, decoder.blocksIndex());
}