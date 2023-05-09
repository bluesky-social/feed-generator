'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var url = require('url');
var multiformats = require('multiformats');
require('../car-browser.js');
var common = require('./common.js');
var readerBrowser = require('../lib/reader-browser.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const fsopen = util.promisify(fs__default["default"].open);
const fsclose = util.promisify(fs__default["default"].close);
const {toHex} = multiformats.bytes;
const __filename$1 = url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('browser-test/node-test-raw.js', document.baseURI).href)));
const __dirname$1 = path__default["default"].dirname(__filename$1);
describe('CarReader.readRaw', () => {
  let allBlocksFlattened;
  before(async () => {
    const data = await common.makeData();
    allBlocksFlattened = data.allBlocksFlattened;
  });
  async function verifyRead(fd) {
    const expectedBlocks = allBlocksFlattened.slice();
    const expectedCids = [];
    for (const {cid} of expectedBlocks) {
      expectedCids.push(cid.toString());
    }
    for (const blockIndex of common.goCarIndex) {
      const {cid, bytes} = await readerBrowser.CarReader.readRaw(fd, blockIndex);
      const index = expectedCids.indexOf(cid.toString());
      common.assert.ok(index >= 0, 'got expected block');
      common.assert.strictEqual(toHex(expectedBlocks[index].bytes), toHex(bytes), 'got expected block content');
      expectedBlocks.splice(index, 1);
      expectedCids.splice(index, 1);
    }
    common.assert.strictEqual(expectedBlocks.length, 0, 'got all expected blocks');
  }
  it('read raw using index (fd)', async () => {
    const fd = await fsopen(path__default["default"].join(__dirname$1, 'go.car'), 'r');
    await verifyRead(fd);
    await fsclose(fd);
  });
  it('read raw using index (FileHandle)', async () => {
    const fd = await fs__default["default"].promises.open(path__default["default"].join(__dirname$1, 'go.car'), 'r');
    await verifyRead(fd);
    await fd.close();
  });
  it('errors', async () => {
    await common.assert.isRejected(readerBrowser.CarReader.readRaw(true, common.goCarIndex[0]), {
      name: 'TypeError',
      message: 'Bad fd'
    });
    const badBlock = Object.assign({}, common.goCarIndex[common.goCarIndex.length - 1]);
    badBlock.blockLength += 10;
    const fd = await fsopen(path__default["default"].join(__dirname$1, 'go.car'), 'r');
    await common.assert.isRejected(readerBrowser.CarReader.readRaw(fd, badBlock), {
      name: 'Error',
      message: `Failed to read entire block (${ badBlock.blockLength - 10 } instead of ${ badBlock.blockLength })`
    });
    await fsclose(fd);
  });
});
