import fs from 'fs';
import { Readable } from 'stream';
import { garbage } from 'ipld-garbage';
import varint from 'varint';
import * as dagCbor from '@ipld/dag-cbor';
import { sha256 } from 'multiformats/hashes/sha2';
import { CID } from 'multiformats/cid';
import {
  CarWriter,
  CarIndexer,
  CarReader,
  CarIndexedReader
} from '../car.js';
import { assert } from './common.js';
describe('Large CAR', () => {
  const objects = [];
  const cids = [];
  const expectedIndex = [];
  it('create, no roots', async () => {
    const {writer, out} = CarWriter.create([]);
    Readable.from(out).pipe(fs.createWriteStream('./test.car'));
    let offset = dagCbor.encode({
      version: 1,
      roots: []
    }).length;
    offset += varint.encode(offset).length;
    for (let i = 0; i < 500; i++) {
      const obj = garbage(1000);
      objects.push(obj);
      const bytes = dagCbor.encode(obj);
      const hash = await sha256.digest(bytes);
      const cid = CID.create(1, dagCbor.code, hash);
      cids.push(cid.toString());
      const blockLength = bytes.length;
      let length = cid.bytes.length + blockLength;
      const lengthLength = varint.encode(length).length;
      length += lengthLength;
      const blockOffset = offset + lengthLength + cid.bytes.length;
      expectedIndex.push({
        cid,
        offset,
        length,
        blockOffset,
        blockLength
      });
      offset += length;
      await writer.put({
        cid,
        bytes
      });
    }
    await writer.close();
  });
  it('CarIndexer.fromIterable', async () => {
    const indexer = await CarIndexer.fromIterable(fs.createReadStream('./test.car'));
    assert.deepStrictEqual(await indexer.getRoots(), []);
    let i = 0;
    for await (const blockIndex of indexer) {
      assert.deepStrictEqual(blockIndex, expectedIndex[i]);
      i++;
    }
  });
  it('CarIndexer.fromBytes', async () => {
    const indexer = await CarIndexer.fromBytes(await fs.promises.readFile('./test.car'));
    assert.deepStrictEqual(await indexer.getRoots(), []);
    let i = 0;
    for await (const blockIndex of indexer) {
      assert.deepStrictEqual(blockIndex, expectedIndex[i]);
      i++;
    }
  });
  it('CarReader.fromBytes', async () => {
    const reader = await CarReader.fromBytes(await fs.promises.readFile('./test.car'));
    assert.deepStrictEqual(await reader.getRoots(), []);
    let i = 0;
    for await (const {cid, bytes} of reader.blocks()) {
      assert.strictEqual(cid.toString(), cids[i], `cid #${ i } ${ cid } <> ${ cids[i] }`);
      const obj = dagCbor.decode(bytes);
      assert.deepStrictEqual(obj, objects[i], `object #${ i }`);
      i++;
    }
  });
  it('CarReader.fromIterable', async () => {
    const reader = await CarReader.fromIterable(fs.createReadStream('./test.car'));
    assert.deepStrictEqual(await reader.getRoots(), []);
    let i = 0;
    for await (const {cid, bytes} of reader.blocks()) {
      assert.strictEqual(cid.toString(), cids[i], `cid #${ i } ${ cid } <> ${ cids[i] }`);
      const obj = dagCbor.decode(bytes);
      assert.deepStrictEqual(obj, objects[i], `object #${ i }`);
      i++;
    }
  });
  it('CarIndexedReader.fromFile', async () => {
    const reader = await CarIndexedReader.fromFile('./test.car');
    assert.deepStrictEqual(await reader.getRoots(), []);
    let i = 0;
    for await (const {cid, bytes} of reader.blocks()) {
      assert.strictEqual(cid.toString(), cids[i], `cid #${ i } ${ cid } <> ${ cids[i] }`);
      const obj = dagCbor.decode(bytes);
      assert.deepStrictEqual(obj, objects[i], `object #${ i }`);
      i++;
    }
  });
  after(async () => {
    return fs.promises.unlink('./test.car').catch(() => {
    });
  });
});