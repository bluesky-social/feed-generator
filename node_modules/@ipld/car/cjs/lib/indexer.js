'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var decoder = require('./decoder.js');

class CarIndexer {
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
    return decodeIndexerComplete(decoder.bytesReader(bytes));
  }
  static async fromIterable(asyncIterable) {
    if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
      throw new TypeError('fromIterable() requires an async iterable');
    }
    return decodeIndexerComplete(decoder.asyncIterableReader(asyncIterable));
  }
}
async function decodeIndexerComplete(reader) {
  const decoder$1 = decoder.createDecoder(reader);
  const {version, roots} = await decoder$1.header();
  return new CarIndexer(version, roots, decoder$1.blocksIndex());
}

exports.CarIndexer = CarIndexer;
