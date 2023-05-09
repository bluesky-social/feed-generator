'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var stream = require('stream');
var cid = require('multiformats/cid');
var indexer = require('./indexer.js');
var reader = require('./reader.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

class CarIndexedReader {
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
      this._fd = await fs__default["default"].promises.open(this._path, 'r');
    }
    const readIndex = {
      cid: key,
      length: 0,
      offset: 0,
      blockLength: blockIndex.blockLength,
      blockOffset: blockIndex.blockOffset
    };
    return reader.CarReader.readRaw(this._fd, readIndex);
  }
  async *blocks() {
    for (const cidStr of this._order) {
      const block = await this.get(cid.CID.parse(cidStr));
      if (!block) {
        throw new Error('Unexpected internal error');
      }
      yield block;
    }
  }
  async *cids() {
    for (const cidStr of this._order) {
      yield cid.CID.parse(cidStr);
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
    const iterable = await indexer.CarIndexer.fromIterable(stream.Readable.from(fs__default["default"].createReadStream(path)));
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
const __browser = false;

exports.CarIndexedReader = CarIndexedReader;
exports.__browser = __browser;
