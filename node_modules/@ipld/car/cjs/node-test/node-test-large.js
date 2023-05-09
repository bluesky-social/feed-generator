'use strict';

var fs = require('fs');
var stream = require('stream');
var ipldGarbage = require('ipld-garbage');
var varint = require('varint');
var dagCbor = require('@ipld/dag-cbor');
var sha2 = require('multiformats/hashes/sha2');
var cid = require('multiformats/cid');
require('../car.js');
var common = require('./common.js');
var writer = require('../lib/writer.js');
var indexer = require('../lib/indexer.js');
var reader = require('../lib/reader.js');
var indexedReader = require('../lib/indexed-reader.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var varint__default = /*#__PURE__*/_interopDefaultLegacy(varint);
var dagCbor__namespace = /*#__PURE__*/_interopNamespace(dagCbor);

describe('Large CAR', () => {
  const objects = [];
  const cids = [];
  const expectedIndex = [];
  it('create, no roots', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create([]);
    stream.Readable.from(out).pipe(fs__default["default"].createWriteStream('./test.car'));
    let offset = dagCbor__namespace.encode({
      version: 1,
      roots: []
    }).length;
    offset += varint__default["default"].encode(offset).length;
    for (let i = 0; i < 500; i++) {
      const obj = ipldGarbage.garbage(1000);
      objects.push(obj);
      const bytes = dagCbor__namespace.encode(obj);
      const hash = await sha2.sha256.digest(bytes);
      const cid$1 = cid.CID.create(1, dagCbor__namespace.code, hash);
      cids.push(cid$1.toString());
      const blockLength = bytes.length;
      let length = cid$1.bytes.length + blockLength;
      const lengthLength = varint__default["default"].encode(length).length;
      length += lengthLength;
      const blockOffset = offset + lengthLength + cid$1.bytes.length;
      expectedIndex.push({
        cid: cid$1,
        offset,
        length,
        blockOffset,
        blockLength
      });
      offset += length;
      await writer$1.put({
        cid: cid$1,
        bytes
      });
    }
    await writer$1.close();
  });
  it('CarIndexer.fromIterable', async () => {
    const indexer$1 = await indexer.CarIndexer.fromIterable(fs__default["default"].createReadStream('./test.car'));
    common.assert.deepStrictEqual(await indexer$1.getRoots(), []);
    let i = 0;
    for await (const blockIndex of indexer$1) {
      common.assert.deepStrictEqual(blockIndex, expectedIndex[i]);
      i++;
    }
  });
  it('CarIndexer.fromBytes', async () => {
    const indexer$1 = await indexer.CarIndexer.fromBytes(await fs__default["default"].promises.readFile('./test.car'));
    common.assert.deepStrictEqual(await indexer$1.getRoots(), []);
    let i = 0;
    for await (const blockIndex of indexer$1) {
      common.assert.deepStrictEqual(blockIndex, expectedIndex[i]);
      i++;
    }
  });
  it('CarReader.fromBytes', async () => {
    const reader$1 = await reader.CarReader.fromBytes(await fs__default["default"].promises.readFile('./test.car'));
    common.assert.deepStrictEqual(await reader$1.getRoots(), []);
    let i = 0;
    for await (const {cid, bytes} of reader$1.blocks()) {
      common.assert.strictEqual(cid.toString(), cids[i], `cid #${ i } ${ cid } <> ${ cids[i] }`);
      const obj = dagCbor__namespace.decode(bytes);
      common.assert.deepStrictEqual(obj, objects[i], `object #${ i }`);
      i++;
    }
  });
  it('CarReader.fromIterable', async () => {
    const reader$1 = await reader.CarReader.fromIterable(fs__default["default"].createReadStream('./test.car'));
    common.assert.deepStrictEqual(await reader$1.getRoots(), []);
    let i = 0;
    for await (const {cid, bytes} of reader$1.blocks()) {
      common.assert.strictEqual(cid.toString(), cids[i], `cid #${ i } ${ cid } <> ${ cids[i] }`);
      const obj = dagCbor__namespace.decode(bytes);
      common.assert.deepStrictEqual(obj, objects[i], `object #${ i }`);
      i++;
    }
  });
  it('CarIndexedReader.fromFile', async () => {
    const reader = await indexedReader.CarIndexedReader.fromFile('./test.car');
    common.assert.deepStrictEqual(await reader.getRoots(), []);
    let i = 0;
    for await (const {cid, bytes} of reader.blocks()) {
      common.assert.strictEqual(cid.toString(), cids[i], `cid #${ i } ${ cid } <> ${ cids[i] }`);
      const obj = dagCbor__namespace.decode(bytes);
      common.assert.deepStrictEqual(obj, objects[i], `object #${ i }`);
      i++;
    }
  });
  after(async () => {
    return fs__default["default"].promises.unlink('./test.car').catch(() => {
    });
  });
});
