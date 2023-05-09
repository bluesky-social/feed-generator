'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cid = require('multiformats/cid');
var encoder = require('./encoder.js');
var iteratorChannel = require('./iterator-channel.js');
var decoder = require('./decoder.js');

class CarWriter {
  constructor(roots, encoder) {
    this._encoder = encoder;
    this._mutex = encoder.setRoots(roots);
    this._ended = false;
  }
  async put(block) {
    if (!(block.bytes instanceof Uint8Array) || !block.cid) {
      throw new TypeError('Can only write {cid, bytes} objects');
    }
    if (this._ended) {
      throw new Error('Already closed');
    }
    const cid$1 = cid.CID.asCID(block.cid);
    if (!cid$1) {
      throw new TypeError('Can only write {cid, bytes} objects');
    }
    this._mutex = this._mutex.then(() => this._encoder.writeBlock({
      cid: cid$1,
      bytes: block.bytes
    }));
    return this._mutex;
  }
  async close() {
    if (this._ended) {
      throw new Error('Already closed');
    }
    await this._mutex;
    this._ended = true;
    return this._encoder.close();
  }
  static create(roots) {
    roots = toRoots(roots);
    const {encoder, iterator} = encodeWriter();
    const writer = new CarWriter(roots, encoder);
    const out = new CarWriterOut(iterator);
    return {
      writer,
      out
    };
  }
  static createAppender() {
    const {encoder, iterator} = encodeWriter();
    encoder.setRoots = () => Promise.resolve();
    const writer = new CarWriter([], encoder);
    const out = new CarWriterOut(iterator);
    return {
      writer,
      out
    };
  }
  static async updateRootsInBytes(bytes, roots) {
    const reader = decoder.bytesReader(bytes);
    await decoder.readHeader(reader);
    const newHeader = encoder.createHeader(roots);
    if (reader.pos !== newHeader.length) {
      throw new Error(`updateRoots() can only overwrite a header of the same length (old header is ${ reader.pos } bytes, new header is ${ newHeader.length } bytes)`);
    }
    bytes.set(newHeader, 0);
    return bytes;
  }
}
class CarWriterOut {
  constructor(iterator) {
    this._iterator = iterator;
  }
  [Symbol.asyncIterator]() {
    if (this._iterating) {
      throw new Error('Multiple iterator not supported');
    }
    this._iterating = true;
    return this._iterator;
  }
}
function encodeWriter() {
  const iw = iteratorChannel.create();
  const {writer, iterator} = iw;
  const encoder$1 = encoder.createEncoder(writer);
  return {
    encoder: encoder$1,
    iterator
  };
}
function toRoots(roots) {
  if (roots === undefined) {
    return [];
  }
  if (!Array.isArray(roots)) {
    const cid$1 = cid.CID.asCID(roots);
    if (!cid$1) {
      throw new TypeError('roots must be a single CID or an array of CIDs');
    }
    return [cid$1];
  }
  const _roots = [];
  for (const root of roots) {
    const _root = cid.CID.asCID(root);
    if (!_root) {
      throw new TypeError('roots must be a single CID or an array of CIDs');
    }
    _roots.push(_root);
  }
  return _roots;
}
const __browser = true;

exports.CarWriter = CarWriter;
exports.CarWriterOut = CarWriterOut;
exports.__browser = __browser;
