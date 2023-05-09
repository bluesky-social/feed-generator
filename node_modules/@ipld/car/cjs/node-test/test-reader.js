'use strict';

var reader = require('../lib/reader.js');
var writer = require('../lib/writer.js');
var Block = require('multiformats/block');
var sha2 = require('multiformats/hashes/sha2');
var raw = require('multiformats/codecs/raw');
var common = require('./common.js');
var verifyStoreReader = require('./verify-store-reader.js');

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

var Block__namespace = /*#__PURE__*/_interopNamespace(Block);
var raw__namespace = /*#__PURE__*/_interopNamespace(raw);

describe('CarReader fromBytes()', () => {
  it('complete', async () => {
    const reader$1 = await reader.CarReader.fromBytes(common.carBytes);
    await verifyStoreReader.verifyRoots(reader$1);
    await verifyStoreReader.verifyHas(reader$1);
    await verifyStoreReader.verifyGet(reader$1);
    await verifyStoreReader.verifyBlocks(reader$1.blocks());
    await verifyStoreReader.verifyCids(reader$1.cids());
    common.assert.strictEqual(reader$1.version, 1);
  });
  it('complete (get before has) switch', async () => {
    const reader$1 = await reader.CarReader.fromBytes(common.carBytes);
    await verifyStoreReader.verifyRoots(reader$1);
    await verifyStoreReader.verifyGet(reader$1);
    await verifyStoreReader.verifyHas(reader$1);
    await verifyStoreReader.verifyBlocks(reader$1.blocks());
    await verifyStoreReader.verifyCids(reader$1.cids());
  });
  it('bad argument', async () => {
    for (const arg of [
        true,
        false,
        null,
        undefined,
        'string',
        100,
        { obj: 'nope' }
      ]) {
      await common.assert.isRejected(reader.CarReader.fromBytes(arg));
    }
  });
  it('decode error - truncated', async () => {
    await common.assert.isRejected(reader.CarReader.fromBytes(common.carBytes.slice(0, common.carBytes.length - 10)), {
      name: 'Error',
      message: 'Unexpected end of data'
    });
  });
  it('decode error - trailing null bytes', async () => {
    const bytes = new Uint8Array(common.carBytes.length + 5);
    bytes.set(common.carBytes);
    try {
      await reader.CarReader.fromBytes(bytes);
    } catch (err) {
      common.assert.strictEqual(err.message, 'Invalid CAR section (zero length)');
      return;
    }
    common.assert.fail('Did not throw');
  });
  it('decode error - bad first byte', async () => {
    const bytes = new Uint8Array(common.carBytes.length + 5);
    bytes.set(common.carBytes);
    bytes[0] = 0;
    try {
      await reader.CarReader.fromBytes(bytes);
    } catch (err) {
      common.assert.strictEqual(err.message, 'Invalid CAR header (zero length)');
      return;
    }
    common.assert.fail('Did not throw');
  });
});
describe('CarReader fromIterable()', () => {
  it('complete (single chunk)', async () => {
    const reader$1 = await reader.CarReader.fromIterable(common.makeIterable(common.carBytes, common.carBytes.length));
    await verifyStoreReader.verifyRoots(reader$1);
    await verifyStoreReader.verifyHas(reader$1);
    await verifyStoreReader.verifyGet(reader$1);
    await verifyStoreReader.verifyBlocks(reader$1.blocks());
    await verifyStoreReader.verifyCids(reader$1.cids());
  });
  it('complete (101-byte chunks)', async () => {
    const reader$1 = await reader.CarReader.fromIterable(common.makeIterable(common.carBytes, 101));
    await verifyStoreReader.verifyRoots(reader$1);
    await verifyStoreReader.verifyHas(reader$1);
    await verifyStoreReader.verifyGet(reader$1);
    await verifyStoreReader.verifyBlocks(reader$1.blocks());
    await verifyStoreReader.verifyCids(reader$1.cids());
  });
  it('complete (64-byte chunks)', async () => {
    const reader$1 = await reader.CarReader.fromIterable(common.makeIterable(common.carBytes, 64));
    await verifyStoreReader.verifyRoots(reader$1);
    await verifyStoreReader.verifyHas(reader$1);
    await verifyStoreReader.verifyGet(reader$1);
    await verifyStoreReader.verifyBlocks(reader$1.blocks());
    await verifyStoreReader.verifyCids(reader$1.cids());
  });
  it('complete (32-byte chunks)', async () => {
    const reader$1 = await reader.CarReader.fromIterable(common.makeIterable(common.carBytes, 32));
    await verifyStoreReader.verifyRoots(reader$1);
    await verifyStoreReader.verifyHas(reader$1);
    await verifyStoreReader.verifyGet(reader$1);
    await verifyStoreReader.verifyBlocks(reader$1.blocks());
    await verifyStoreReader.verifyCids(reader$1.cids());
  });
  it('handle zero-byte chunks', async () => {
    const {writer: writer$1, out} = await writer.CarWriter.create([]);
    const b1 = await Block__namespace.encode({
      value: Uint8Array.from([
        0,
        1,
        2
      ]),
      hasher: sha2.sha256,
      codec: raw__namespace
    });
    writer$1.put(b1);
    const b2 = await Block__namespace.encode({
      value: Uint8Array.from([]),
      hasher: sha2.sha256,
      codec: raw__namespace
    });
    writer$1.put(b2);
    const b3 = await Block__namespace.encode({
      value: Uint8Array.from([
        3,
        4,
        5
      ]),
      hasher: sha2.sha256,
      codec: raw__namespace
    });
    writer$1.put(b3);
    const closePromise = writer$1.close();
    const reader$1 = await reader.CarReader.fromIterable(out);
    const b1a = await reader$1.get(b1.cid);
    common.assert.isDefined(b1a);
    common.assert.deepStrictEqual(b1a && Array.from(b1a.bytes), [
      0,
      1,
      2
    ]);
    const b2a = await reader$1.get(b2.cid);
    common.assert.isDefined(b2a);
    common.assert.deepStrictEqual(b2a && Array.from(b2a.bytes), []);
    const b3a = await reader$1.get(b3.cid);
    common.assert.isDefined(b3a);
    common.assert.deepStrictEqual(b3a && Array.from(b3a.bytes), [
      3,
      4,
      5
    ]);
    await closePromise;
  });
  it('bad argument', async () => {
    for (const arg of [
        new Uint8Array(0),
        true,
        false,
        null,
        undefined,
        'string',
        100,
        { obj: 'nope' }
      ]) {
      await common.assert.isRejected(reader.CarReader.fromIterable(arg));
    }
  });
  it('decode error - truncated', async () => {
    await common.assert.isRejected(reader.CarReader.fromIterable(common.makeIterable(common.carBytes.slice(0, common.carBytes.length - 10), 64)), {
      name: 'Error',
      message: 'Unexpected end of data'
    });
  });
});
