'use strict';

var path = require('path');
var url = require('url');
var fs = require('fs');
var util = require('util');
var cid = require('multiformats/cid');
var readerBrowser = require('../lib/reader-browser.js');
var writerBrowser = require('../lib/writer-browser.js');
var verifyStoreReader = require('./verify-store-reader.js');
var common = require('./common.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const fsopen = util.promisify(fs__default["default"].open);
const fsclose = util.promisify(fs__default["default"].close);
const __filename$1 = url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('browser-test/node-test-updateroots.js', document.baseURI).href)));
const __dirname$1 = path__default["default"].dirname(__filename$1);
const goCarPath = path__default["default"].join(__dirname$1, 'go.car');
const tmpCarPath = path__default["default"].join(__dirname$1, 'tmp.car');
const newRoots = [
  cid.CID.parse('bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq'),
  cid.CID.parse('bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4')
];
async function verify() {
  const reader = await readerBrowser.CarReader.fromIterable(fs__default["default"].createReadStream(tmpCarPath));
  await common.assert.isRejected(verifyStoreReader.verifyRoots(reader));
  common.assert.deepEqual(await reader.getRoots(), newRoots);
  await verifyStoreReader.verifyHas(reader);
  await verifyStoreReader.verifyGet(reader);
  await verifyStoreReader.verifyBlocks(reader.blocks(), true);
  await verifyStoreReader.verifyCids(reader.cids(), true);
}
describe('Node CarWriter.updateHeader()', () => {
  before(async () => {
    try {
      await fs__default["default"].promises.unlink(tmpCarPath);
    } catch (e) {
    }
  });
  beforeEach(async () => {
    await fs__default["default"].promises.copyFile(goCarPath, tmpCarPath);
  });
  afterEach(async () => {
    await fs__default["default"].promises.unlink(tmpCarPath);
  });
  it('update roots (fd)', async () => {
    const fd = await fsopen(tmpCarPath, 'r+');
    await writerBrowser.CarWriter.updateRootsInFile(fd, newRoots);
    await fsclose(fd);
    await verify();
  });
  it('update roots (FileHandle)', async () => {
    const fd = await fs__default["default"].promises.open(tmpCarPath, 'r+');
    await writerBrowser.CarWriter.updateRootsInFile(fd, newRoots);
    await fd.close();
    await verify();
  });
  it('error: bad fd', async () => {
    await common.assert.isRejected(writerBrowser.CarWriter.updateRootsInFile(true, newRoots), {
      name: 'TypeError',
      message: 'Bad fd'
    });
  });
  it('error: wrong header size', async () => {
    const fd = await fs__default["default"].promises.open(tmpCarPath, 'r+');
    await common.assert.isRejected(writerBrowser.CarWriter.updateRootsInFile(fd, [
      ...newRoots,
      newRoots[0]
    ]), /can only overwrite a header of the same length/);
    await common.assert.isRejected(writerBrowser.CarWriter.updateRootsInFile(fd, [newRoots[0]]), /can only overwrite a header of the same length/);
    await common.assert.isRejected(writerBrowser.CarWriter.updateRootsInFile(fd, []), /can only overwrite a header of the same length/);
    await fd.close();
  });
});
