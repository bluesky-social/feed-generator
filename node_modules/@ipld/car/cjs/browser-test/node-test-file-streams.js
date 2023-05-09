'use strict';

var path = require('path');
var url = require('url');
var fs = require('fs');
var stream = require('stream');
var util = require('util');
require('../car-browser.js');
var common = require('./common.js');
var verifyStoreReader = require('./verify-store-reader.js');
var readerBrowser = require('../lib/reader-browser.js');
var writerBrowser = require('../lib/writer-browser.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const __filename$1 = url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('browser-test/node-test-file-streams.js', document.baseURI).href)));
const __dirname$1 = path__default["default"].dirname(__filename$1);
const tmpCarPath = path__default["default"].join(__dirname$1, 'tmp.car');
describe('Node Streams CarReader.fromIterable()', () => {
  let allBlocksFlattened;
  let roots;
  before(async () => {
    const data = await common.makeData();
    const cborBlocks = data.cborBlocks;
    allBlocksFlattened = data.allBlocksFlattened;
    roots = [
      cborBlocks[0].cid,
      cborBlocks[1].cid
    ];
    try {
      await fs__default["default"].promises.unlink(tmpCarPath);
    } catch (e) {
    }
  });
  it('from fixture file', async () => {
    const inStream = fs__default["default"].createReadStream(path__default["default"].join(__dirname$1, './go.car'));
    const reader = await readerBrowser.CarReader.fromIterable(inStream);
    await verifyStoreReader.verifyRoots(reader);
    await verifyStoreReader.verifyHas(reader);
    await verifyStoreReader.verifyGet(reader);
    await verifyStoreReader.verifyBlocks(reader.blocks(), true);
    await verifyStoreReader.verifyCids(reader.cids(), true);
  });
  it('complete', async () => {
    const {writer, out} = writerBrowser.CarWriter.create(roots);
    const pipe = util.promisify(stream.pipeline)(stream.Readable.from(out), fs__default["default"].createWriteStream(tmpCarPath));
    for (const block of allBlocksFlattened) {
      await writer.put(block);
    }
    await writer.close();
    await pipe;
    const sizes = await Promise.all([
      'go.car',
      'tmp.car'
    ].map(async car => {
      return (await fs__default["default"].promises.stat(path__default["default"].join(__dirname$1, car))).size;
    }));
    common.assert.strictEqual(sizes[0], sizes[1]);
    const inStream = fs__default["default"].createReadStream(tmpCarPath);
    const reader = await readerBrowser.CarReader.fromIterable(inStream);
    await verifyStoreReader.verifyRoots(reader);
    await verifyStoreReader.verifyHas(reader);
    await verifyStoreReader.verifyGet(reader);
    await verifyStoreReader.verifyBlocks(reader.blocks(), true);
    await verifyStoreReader.verifyCids(reader.cids(), true);
    await fs__default["default"].promises.unlink(tmpCarPath);
  });
});
