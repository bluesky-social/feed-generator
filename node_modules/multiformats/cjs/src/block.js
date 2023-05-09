'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./index.js');
var cid = require('./cid.js');
var bytes = require('./bytes.js');

const readonly = ({enumerable = true, configurable = false} = {}) => ({
  enumerable,
  configurable,
  writable: false
});
const links = function* (source, base) {
  if (source == null)
    return;
  if (source instanceof Uint8Array)
    return;
  for (const [key, value] of Object.entries(source)) {
    const path = [
      ...base,
      key
    ];
    if (value != null && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const [index, element] of value.entries()) {
          const elementPath = [
            ...path,
            index
          ];
          const cid$1 = cid.CID.asCID(element);
          if (cid$1) {
            yield [
              elementPath.join('/'),
              cid$1
            ];
          } else if (typeof element === 'object') {
            yield* links(element, elementPath);
          }
        }
      } else {
        const cid$1 = cid.CID.asCID(value);
        if (cid$1) {
          yield [
            path.join('/'),
            cid$1
          ];
        } else {
          yield* links(value, path);
        }
      }
    }
  }
};
const tree = function* (source, base) {
  if (source == null)
    return;
  for (const [key, value] of Object.entries(source)) {
    const path = [
      ...base,
      key
    ];
    yield path.join('/');
    if (value != null && !(value instanceof Uint8Array) && typeof value === 'object' && !cid.CID.asCID(value)) {
      if (Array.isArray(value)) {
        for (const [index, element] of value.entries()) {
          const elementPath = [
            ...path,
            index
          ];
          yield elementPath.join('/');
          if (typeof element === 'object' && !cid.CID.asCID(element)) {
            yield* tree(element, elementPath);
          }
        }
      } else {
        yield* tree(value, path);
      }
    }
  }
};
const get = (source, path) => {
  let node = source;
  for (const [index, key] of path.entries()) {
    node = node[key];
    if (node == null) {
      throw new Error(`Object has no property at ${ path.slice(0, index + 1).map(part => `[${ JSON.stringify(part) }]`).join('') }`);
    }
    const cid$1 = cid.CID.asCID(node);
    if (cid$1) {
      return {
        value: cid$1,
        remaining: path.slice(index + 1).join('/')
      };
    }
  }
  return { value: node };
};
class Block {
  constructor({cid, bytes, value}) {
    if (!cid || !bytes || typeof value === 'undefined')
      throw new Error('Missing required argument');
    this.cid = cid;
    this.bytes = bytes;
    this.value = value;
    this.asBlock = this;
    Object.defineProperties(this, {
      cid: readonly(),
      bytes: readonly(),
      value: readonly(),
      asBlock: readonly()
    });
  }
  links() {
    return links(this.value, []);
  }
  tree() {
    return tree(this.value, []);
  }
  get(path = '/') {
    return get(this.value, path.split('/').filter(Boolean));
  }
}
const encode = async ({value, codec, hasher}) => {
  if (typeof value === 'undefined')
    throw new Error('Missing required argument "value"');
  if (!codec || !hasher)
    throw new Error('Missing required argument: codec or hasher');
  const bytes = codec.encode(value);
  const hash = await hasher.digest(bytes);
  const cid$1 = cid.CID.create(1, codec.code, hash);
  return new Block({
    value,
    bytes,
    cid: cid$1
  });
};
const decode = async ({bytes, codec, hasher}) => {
  if (!bytes)
    throw new Error('Missing required argument "bytes"');
  if (!codec || !hasher)
    throw new Error('Missing required argument: codec or hasher');
  const value = codec.decode(bytes);
  const hash = await hasher.digest(bytes);
  const cid$1 = cid.CID.create(1, codec.code, hash);
  return new Block({
    value,
    bytes,
    cid: cid$1
  });
};
const createUnsafe = ({
  bytes,
  cid,
  value: maybeValue,
  codec
}) => {
  const value = maybeValue !== undefined ? maybeValue : codec && codec.decode(bytes);
  if (value === undefined)
    throw new Error('Missing required argument, must either provide "value" or "codec"');
  return new Block({
    cid,
    bytes,
    value
  });
};
const create = async ({bytes: bytes$1, cid, hasher, codec}) => {
  if (!bytes$1)
    throw new Error('Missing required argument "bytes"');
  if (!hasher)
    throw new Error('Missing required argument "hasher"');
  const value = codec.decode(bytes$1);
  const hash = await hasher.digest(bytes$1);
  if (!bytes.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match bytes');
  }
  return createUnsafe({
    bytes: bytes$1,
    cid,
    value,
    codec
  });
};

exports.Block = Block;
exports.create = create;
exports.createUnsafe = createUnsafe;
exports.decode = decode;
exports.encode = encode;
