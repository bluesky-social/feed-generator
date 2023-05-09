import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  Readable,
  pipeline
} from 'stream';
import { promisify } from 'util';
import {
  CarReader,
  CarWriter
} from '../car.js';
import {
  makeData,
  assert
} from './common.js';
import {
  verifyRoots,
  verifyHas,
  verifyGet,
  verifyBlocks,
  verifyCids
} from './verify-store-reader.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmpCarPath = path.join(__dirname, 'tmp.car');
describe('Node Streams CarReader.fromIterable()', () => {
  let allBlocksFlattened;
  let roots;
  before(async () => {
    const data = await makeData();
    const cborBlocks = data.cborBlocks;
    allBlocksFlattened = data.allBlocksFlattened;
    roots = [
      cborBlocks[0].cid,
      cborBlocks[1].cid
    ];
    try {
      await fs.promises.unlink(tmpCarPath);
    } catch (e) {
    }
  });
  it('from fixture file', async () => {
    const inStream = fs.createReadStream(path.join(__dirname, './go.car'));
    const reader = await CarReader.fromIterable(inStream);
    await verifyRoots(reader);
    await verifyHas(reader);
    await verifyGet(reader);
    await verifyBlocks(reader.blocks(), true);
    await verifyCids(reader.cids(), true);
  });
  it('complete', async () => {
    const {writer, out} = CarWriter.create(roots);
    const pipe = promisify(pipeline)(Readable.from(out), fs.createWriteStream(tmpCarPath));
    for (const block of allBlocksFlattened) {
      await writer.put(block);
    }
    await writer.close();
    await pipe;
    const sizes = await Promise.all([
      'go.car',
      'tmp.car'
    ].map(async car => {
      return (await fs.promises.stat(path.join(__dirname, car))).size;
    }));
    assert.strictEqual(sizes[0], sizes[1]);
    const inStream = fs.createReadStream(tmpCarPath);
    const reader = await CarReader.fromIterable(inStream);
    await verifyRoots(reader);
    await verifyHas(reader);
    await verifyGet(reader);
    await verifyBlocks(reader.blocks(), true);
    await verifyCids(reader.cids(), true);
    await fs.promises.unlink(tmpCarPath);
  });
});