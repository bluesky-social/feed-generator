'use strict';

var iterator = require('../lib/iterator.js');
var common = require('./common.js');
var verifyStoreReader = require('./verify-store-reader.js');

async function verifyBlockIterator(iter) {
  await verifyStoreReader.verifyRoots(iter);
  await verifyStoreReader.verifyBlocks(iter);
  common.assert.strictEqual(iter.version, 1);
  return iter;
}
async function verifyCIDIterator(iter) {
  await verifyStoreReader.verifyRoots(iter);
  await verifyStoreReader.verifyCids(iter);
  common.assert.strictEqual(iter.version, 1);
  return iter;
}
for (const type of [
    'Block',
    'CID'
  ]) {
  describe(`Car${ type }Iterator`, () => {
    it('fromBytes()', async () => {
      if (type === 'Block') {
        await verifyBlockIterator(await iterator.CarBlockIterator.fromBytes(common.carBytes));
      } else {
        await verifyCIDIterator(await iterator.CarCIDIterator.fromBytes(common.carBytes));
      }
    });
    it('fromBytes() bad double read', async () => {
      if (type === 'Block') {
        const iter = await verifyBlockIterator(await iterator.CarBlockIterator.fromBytes(common.carBytes));
        await common.assert.isRejected(verifyStoreReader.verifyBlocks(iter), /more than once/i);
      } else {
        const iter = await verifyCIDIterator(await iterator.CarCIDIterator.fromBytes(common.carBytes));
        await common.assert.isRejected(verifyStoreReader.verifyCids(iter), /more than once/i);
      }
    });
    it('fromBytes() bad argument', async () => {
      for (const arg of [
          true,
          false,
          null,
          undefined,
          'string',
          100,
          { obj: 'nope' }
        ]) {
        await common.assert.isRejected((type === 'Block' ? iterator.CarBlockIterator : iterator.CarCIDIterator).fromBytes(arg));
      }
    });
    it('fromIterable() bad argument', async () => {
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
        await common.assert.isRejected((type === 'Block' ? iterator.CarBlockIterator : iterator.CarCIDIterator).fromIterable(arg));
      }
    });
    for (const chunkSize of [
        common.carBytes.length,
        100,
        64,
        32
      ]) {
      const chunkDesc = chunkSize === common.carBytes.length ? 'single chunk' : `${ chunkSize }  bytes`;
      it(`fromIterable() blocks (${ chunkDesc })`, async () => {
        if (type === 'Block') {
          await verifyBlockIterator(await iterator.CarBlockIterator.fromIterable(common.makeIterable(common.carBytes, chunkSize)));
        } else {
          await verifyCIDIterator(await iterator.CarCIDIterator.fromIterable(common.makeIterable(common.carBytes, chunkSize)));
        }
      });
    }
  });
}
