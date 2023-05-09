import path from 'path';
import { fileURLToPath } from 'url';
import { CarIndexedReader } from '../lib/indexed-reader-browser.js';
import {
  assert,
  goCarIndex
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
describe('CarIndexedReader fromFile()', () => {
  it('complete', async () => {
    const reader = await CarIndexedReader.fromFile(path.join(__dirname, 'go.car'));
    await verifyRoots(reader);
    await verifyHas(reader);
    await verifyGet(reader);
    await verifyBlocks(reader.blocks(), true);
    await verifyCids(reader.cids(), true);
    let i = 0;
    for await (const block of reader.blocks()) {
      assert.strictEqual(block.cid.toString(), goCarIndex[i++].cid.toString());
    }
    i = 0;
    for await (const cid of reader.cids()) {
      assert.strictEqual(cid.toString(), goCarIndex[i++].cid.toString());
    }
    assert.strictEqual(reader.version, 1);
    await reader.close();
  });
  it('bad argument', async () => {
    for (const arg of [
        true,
        false,
        null,
        undefined,
        Uint8Array.from([
          1,
          2,
          3
        ]),
        100,
        { obj: 'nope' }
      ]) {
      await assert.isRejected(CarIndexedReader.fromFile(arg));
    }
  });
});