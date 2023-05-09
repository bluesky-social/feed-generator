import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { bytes } from 'multiformats';
import { CarReader } from '../car.js';
import {
  assert,
  makeData,
  goCarIndex
} from './common.js';
const fsopen = promisify(fs.open);
const fsclose = promisify(fs.close);
const {toHex} = bytes;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
describe('CarReader.readRaw', () => {
  let allBlocksFlattened;
  before(async () => {
    const data = await makeData();
    allBlocksFlattened = data.allBlocksFlattened;
  });
  async function verifyRead(fd) {
    const expectedBlocks = allBlocksFlattened.slice();
    const expectedCids = [];
    for (const {cid} of expectedBlocks) {
      expectedCids.push(cid.toString());
    }
    for (const blockIndex of goCarIndex) {
      const {cid, bytes} = await CarReader.readRaw(fd, blockIndex);
      const index = expectedCids.indexOf(cid.toString());
      assert.ok(index >= 0, 'got expected block');
      assert.strictEqual(toHex(expectedBlocks[index].bytes), toHex(bytes), 'got expected block content');
      expectedBlocks.splice(index, 1);
      expectedCids.splice(index, 1);
    }
    assert.strictEqual(expectedBlocks.length, 0, 'got all expected blocks');
  }
  it('read raw using index (fd)', async () => {
    const fd = await fsopen(path.join(__dirname, 'go.car'), 'r');
    await verifyRead(fd);
    await fsclose(fd);
  });
  it('read raw using index (FileHandle)', async () => {
    const fd = await fs.promises.open(path.join(__dirname, 'go.car'), 'r');
    await verifyRead(fd);
    await fd.close();
  });
  it('errors', async () => {
    await assert.isRejected(CarReader.readRaw(true, goCarIndex[0]), {
      name: 'TypeError',
      message: 'Bad fd'
    });
    const badBlock = Object.assign({}, goCarIndex[goCarIndex.length - 1]);
    badBlock.blockLength += 10;
    const fd = await fsopen(path.join(__dirname, 'go.car'), 'r');
    await assert.isRejected(CarReader.readRaw(fd, badBlock), {
      name: 'Error',
      message: `Failed to read entire block (${ badBlock.blockLength - 10 } instead of ${ badBlock.blockLength })`
    });
    await fsclose(fd);
  });
});