'use strict';

var writer = require('../lib/writer.js');
var reader = require('../lib/reader.js');
var multiformats = require('multiformats');
var common = require('./common.js');
var verifyStoreReader = require('./verify-store-reader.js');

const {toHex} = multiformats.bytes;
function concatBytes(chunks) {
  const length = chunks.reduce((p, c) => p + c.length, 0);
  const bytes = new Uint8Array(length);
  let off = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, off);
    off += chunk.length;
  }
  return bytes;
}
function collector(iterable) {
  const chunks = [];
  const cfn = (async () => {
    for await (const chunk of iterable) {
      chunks.push(chunk);
    }
    return concatBytes(chunks);
  })();
  return cfn;
}
const newRoots = [
  multiformats.CID.parse('bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq'),
  multiformats.CID.parse('bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4')
];
async function verifyUpdateRoots(bytes) {
  const reader$1 = await reader.CarReader.fromBytes(bytes);
  await common.assert.isRejected(verifyStoreReader.verifyRoots(reader$1));
  common.assert.deepEqual(await reader$1.getRoots(), newRoots);
  await verifyStoreReader.verifyHas(reader$1);
  await verifyStoreReader.verifyGet(reader$1);
  await verifyStoreReader.verifyBlocks(reader$1.blocks(), true);
  await verifyStoreReader.verifyCids(reader$1.cids(), true);
}
describe('CarWriter', () => {
  let cborBlocks;
  let allBlocks;
  let allBlocksFlattened;
  let roots;
  function assertCarData(actual) {
    common.assert.strictEqual(toHex(actual), toHex(common.carBytes), 'got expected bytes');
  }
  before(async () => {
    const data = await common.makeData();
    cborBlocks = data.cborBlocks;
    allBlocks = data.allBlocks;
    allBlocksFlattened = data.allBlocksFlattened;
    roots = [
      cborBlocks[0].cid,
      cborBlocks[1].cid
    ];
  });
  it('complete', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots);
    common.assert.strictEqual(typeof out[Symbol.asyncIterator], 'function');
    const collection = collector(out);
    const writeQueue = [];
    for (const block of allBlocksFlattened) {
      writeQueue.push(writer$1.put(block));
    }
    writeQueue.push(writer$1.close());
    let collected = false;
    collection.then(bytes => {
      collected = true;
      assertCarData(bytes);
    });
    await Promise.all(writeQueue);
    common.assert.strictEqual(collected, true);
  });
  it('complete, deferred collection', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots);
    const writeQueue = [];
    for (const block of allBlocksFlattened) {
      writeQueue.push(writer$1.put(block));
    }
    writeQueue.push(writer$1.close());
    let collected = false;
    collector(out).then(bytes => {
      collected = true;
      assertCarData(bytes);
    });
    await Promise.all(writeQueue);
    common.assert.strictEqual(collected, true);
  });
  it('complete, close after write', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots);
    common.assert.strictEqual(typeof out[Symbol.asyncIterator], 'function');
    const collection = collector(out);
    const writeQueue = [];
    for (const block of allBlocksFlattened) {
      writeQueue.push(writer$1.put(block));
    }
    writeQueue.push(writer$1.close());
    let written = false;
    Promise.all(writeQueue).then(() => {
      written = true;
    });
    const bytes = await collection;
    common.assert.strictEqual(written, false);
    await Promise.resolve();
    assertCarData(bytes);
  });
  it('complete, no queue', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots);
    const collection = collector(out);
    for (const block of allBlocksFlattened) {
      await writer$1.put(block);
    }
    await writer$1.close();
    const bytes = await collection;
    assertCarData(bytes);
  });
  it('complete, slow drip', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots);
    common.assert.strictEqual(typeof out[Symbol.asyncIterator], 'function');
    const collection = collector(out);
    for (const block of allBlocksFlattened) {
      writer$1.put(block);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await writer$1.close();
    await new Promise(resolve => setTimeout(resolve, 100));
    const bytes = await collection;
    assertCarData(bytes);
  });
  it('complete, no queue, deferred collection', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots);
    for (const block of allBlocksFlattened) {
      writer$1.put(block);
    }
    writer$1.close();
    const collection = collector(out);
    const bytes = await collection;
    assertCarData(bytes);
  });
  it('single root', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create(roots[0]);
    const collection = collector(out);
    for (const block of allBlocksFlattened) {
      await writer$1.put(block);
    }
    await writer$1.close();
    const bytes = await collection;
    const expectedRootDef = 'a265726f6f747381d82a58250001711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8b6776657273696f6e01';
    const expectedStart = (expectedRootDef.length / 2).toString(16) + expectedRootDef + '28';
    common.assert.strictEqual(toHex(bytes).substring(0, expectedStart.length), expectedStart);
  });
  it('no roots', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create();
    const collection = collector(out);
    for (const block of allBlocksFlattened) {
      await writer$1.put(block);
    }
    await writer$1.close();
    const bytes = await collection;
    const expectedRootDef = 'a265726f6f7473806776657273696f6e01';
    const expectedStart = (expectedRootDef.length / 2).toString(16) + expectedRootDef + '28';
    common.assert.strictEqual(toHex(bytes).substring(0, expectedStart.length), expectedStart);
  });
  it('appender', async () => {
    let writerOut = writer.CarWriter.create(roots);
    let collection = collector(writerOut.out);
    await writerOut.writer.close();
    const headerBytes = await collection;
    const append = async index => {
      writerOut = writer.CarWriter.createAppender();
      collection = collector(writerOut.out);
      for (const block of allBlocks[index][1]) {
        await writerOut.writer.put(block);
      }
      await writerOut.writer.close();
      return collection;
    };
    const rawBytes = await append(0);
    const pbBytes = await append(1);
    const cborBytes = await append(2);
    common.assert(rawBytes.length > 0);
    common.assert(pbBytes.length > 0);
    common.assert(cborBytes.length > 0);
    const reassembled = concatBytes([
      headerBytes,
      rawBytes,
      pbBytes,
      cborBytes
    ]);
    common.assert.strictEqual(toHex(reassembled), toHex(common.carBytes));
  });
  it('bad argument for create()', () => {
    for (const arg of [
        new Uint8Array(0),
        true,
        false,
        null,
        'string',
        100,
        { obj: 'nope' },
        [false]
      ]) {
      common.assert.throws(() => writer.CarWriter.create(arg));
    }
  });
  it('bad argument for put()', async () => {
    const {writer: writer$1} = writer.CarWriter.create();
    for (const arg of [
        new Uint8Array(0),
        true,
        false,
        null,
        'string',
        100,
        { obj: 'nope' },
        [false]
      ]) {
      await common.assert.isRejected(writer$1.put(arg));
    }
    for (const arg of [
        true,
        false,
        null,
        'string',
        100,
        { obj: 'nope' },
        [false]
      ]) {
      await common.assert.isRejected(writer$1.put({
        bytes: new Uint8Array(0),
        cid: arg
      }));
    }
    for (const arg of [
        true,
        false,
        null,
        'string',
        100,
        { obj: 'nope' },
        [false]
      ]) {
      await common.assert.isRejected(writer$1.put({
        cid: common.rndCid,
        bytes: arg
      }));
    }
  });
  it('bad write after closed', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create();
    const collection = collector(out);
    await writer$1.put(allBlocksFlattened[0]);
    await writer$1.close();
    await common.assert.isRejected(writer$1.put(allBlocksFlattened[1]), /closed/);
    await collection;
  });
  it('bad attempt to multiple iterate', async () => {
    const {out} = writer.CarWriter.create();
    collector(out);
    await common.assert.isRejected(collector(out), /multiple iterator/i);
  });
  it('bad attempt to multiple close', async () => {
    const {writer: writer$1, out} = writer.CarWriter.create();
    collector(out);
    await writer$1.close();
    await common.assert.isRejected(writer$1.close(), /closed/i);
  });
  it('update roots (fd)', async () => {
    const bytes = common.carBytes.slice();
    await writer.CarWriter.updateRootsInBytes(bytes, newRoots);
    await verifyUpdateRoots(bytes);
  });
  it('update roots error: wrong header size', async () => {
    const bytes = common.carBytes.slice();
    await common.assert.isRejected(writer.CarWriter.updateRootsInBytes(bytes, [
      ...newRoots,
      newRoots[0]
    ]), /can only overwrite a header of the same length/);
    await common.assert.isRejected(writer.CarWriter.updateRootsInBytes(bytes, [newRoots[0]]), /can only overwrite a header of the same length/);
    await common.assert.isRejected(writer.CarWriter.updateRootsInBytes(bytes, []), /can only overwrite a header of the same length/);
  });
});
