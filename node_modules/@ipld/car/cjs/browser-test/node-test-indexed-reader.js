'use strict';

var path = require('path');
var url = require('url');
var indexedReaderBrowser = require('../lib/indexed-reader-browser.js');
var common = require('./common.js');
var verifyStoreReader = require('./verify-store-reader.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

const __filename$1 = url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('browser-test/node-test-indexed-reader.js', document.baseURI).href)));
const __dirname$1 = path__default["default"].dirname(__filename$1);
describe('CarIndexedReader fromFile()', () => {
  it('complete', async () => {
    const reader = await indexedReaderBrowser.CarIndexedReader.fromFile(path__default["default"].join(__dirname$1, 'go.car'));
    await verifyStoreReader.verifyRoots(reader);
    await verifyStoreReader.verifyHas(reader);
    await verifyStoreReader.verifyGet(reader);
    await verifyStoreReader.verifyBlocks(reader.blocks(), true);
    await verifyStoreReader.verifyCids(reader.cids(), true);
    let i = 0;
    for await (const block of reader.blocks()) {
      common.assert.strictEqual(block.cid.toString(), common.goCarIndex[i++].cid.toString());
    }
    i = 0;
    for await (const cid of reader.cids()) {
      common.assert.strictEqual(cid.toString(), common.goCarIndex[i++].cid.toString());
    }
    common.assert.strictEqual(reader.version, 1);
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
      await common.assert.isRejected(indexedReaderBrowser.CarIndexedReader.fromFile(arg));
    }
  });
});
