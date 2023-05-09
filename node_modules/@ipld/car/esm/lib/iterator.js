import {
  asyncIterableReader,
  bytesReader,
  createDecoder
} from './decoder.js';
export class CarIteratorBase {
  constructor(version, roots, iterable) {
    this._version = version;
    this._roots = roots;
    this._iterable = iterable;
    this._decoded = false;
  }
  get version() {
    return this._version;
  }
  async getRoots() {
    return this._roots;
  }
}
export class CarBlockIterator extends CarIteratorBase {
  [Symbol.asyncIterator]() {
    if (this._decoded) {
      throw new Error('Cannot decode more than once');
    }
    if (!this._iterable) {
      throw new Error('Block iterable not found');
    }
    this._decoded = true;
    return this._iterable[Symbol.asyncIterator]();
  }
  static async fromBytes(bytes) {
    const {version, roots, iterator} = await fromBytes(bytes);
    return new CarBlockIterator(version, roots, iterator);
  }
  static async fromIterable(asyncIterable) {
    const {version, roots, iterator} = await fromIterable(asyncIterable);
    return new CarBlockIterator(version, roots, iterator);
  }
}
export class CarCIDIterator extends CarIteratorBase {
  [Symbol.asyncIterator]() {
    if (this._decoded) {
      throw new Error('Cannot decode more than once');
    }
    if (!this._iterable) {
      throw new Error('Block iterable not found');
    }
    this._decoded = true;
    const iterable = this._iterable[Symbol.asyncIterator]();
    return {
      async next() {
        const next = await iterable.next();
        if (next.done) {
          return next;
        }
        return {
          done: false,
          value: next.value.cid
        };
      }
    };
  }
  static async fromBytes(bytes) {
    const {version, roots, iterator} = await fromBytes(bytes);
    return new CarCIDIterator(version, roots, iterator);
  }
  static async fromIterable(asyncIterable) {
    const {version, roots, iterator} = await fromIterable(asyncIterable);
    return new CarCIDIterator(version, roots, iterator);
  }
}
async function fromBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('fromBytes() requires a Uint8Array');
  }
  return decodeIterator(bytesReader(bytes));
}
async function fromIterable(asyncIterable) {
  if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
    throw new TypeError('fromIterable() requires an async iterable');
  }
  return decodeIterator(asyncIterableReader(asyncIterable));
}
async function decodeIterator(reader) {
  const decoder = createDecoder(reader);
  const {version, roots} = await decoder.header();
  return {
    version,
    roots,
    iterator: decoder.blocks()
  };
}