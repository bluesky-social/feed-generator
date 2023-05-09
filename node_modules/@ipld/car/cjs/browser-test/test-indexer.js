'use strict';

var indexer = require('../lib/indexer.js');
var common = require('./common.js');
var verifyStoreReader = require('./verify-store-reader.js');

describe('CarIndexer fromBytes()', () => {
  it('complete', async () => {
    const indexer$1 = await indexer.CarIndexer.fromBytes(common.goCarBytes);
    await verifyStoreReader.verifyRoots(indexer$1);
    common.assert.strictEqual(indexer$1.version, 1);
    const indexData = [];
    for await (const index of indexer$1) {
      indexData.push(index);
    }
    common.assert.deepStrictEqual(indexData, common.goCarIndex);
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
      await common.assert.isRejected(indexer.CarIndexer.fromBytes(arg));
    }
  });
});
describe('CarIndexer fromIterable()', () => {
  async function verifyIndexer(indexer) {
    await verifyStoreReader.verifyRoots(indexer);
    common.assert.strictEqual(indexer.version, 1);
    const indexData = [];
    for await (const index of indexer) {
      indexData.push(index);
    }
    common.assert.deepStrictEqual(indexData, common.goCarIndex);
  }
  it('complete (single chunk)', async () => {
    const indexer$1 = await indexer.CarIndexer.fromIterable(common.makeIterable(common.goCarBytes, common.goCarBytes.length));
    return verifyIndexer(indexer$1);
  });
  it('complete (101-byte chunks)', async () => {
    const indexer$1 = await indexer.CarIndexer.fromIterable(common.makeIterable(common.goCarBytes, 101));
    return verifyIndexer(indexer$1);
  });
  it('complete (32-byte chunks)', async () => {
    const indexer$1 = await indexer.CarIndexer.fromIterable(common.makeIterable(common.goCarBytes, 32));
    return verifyIndexer(indexer$1);
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
      await common.assert.isRejected(indexer.CarIndexer.fromIterable(arg));
    }
  });
});
