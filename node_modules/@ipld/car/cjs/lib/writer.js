'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var util = require('util');
var writerBrowser = require('./writer-browser.js');
var decoder = require('./decoder.js');
var encoder = require('./encoder.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const fsread = util.promisify(fs__default["default"].read);
const fswrite = util.promisify(fs__default["default"].write);
class CarWriter extends writerBrowser.CarWriter {
  static async updateRootsInFile(fd, roots) {
    const chunkSize = 256;
    let bytes;
    let offset = 0;
    let readChunk;
    if (typeof fd === 'number') {
      readChunk = async () => (await fsread(fd, bytes, 0, chunkSize, offset)).bytesRead;
    } else if (typeof fd === 'object' && typeof fd.read === 'function') {
      readChunk = async () => (await fd.read(bytes, 0, chunkSize, offset)).bytesRead;
    } else {
      throw new TypeError('Bad fd');
    }
    const fdReader = decoder.chunkReader(async () => {
      bytes = new Uint8Array(chunkSize);
      const read = await readChunk();
      offset += read;
      return read < chunkSize ? bytes.subarray(0, read) : bytes;
    });
    await decoder.readHeader(fdReader);
    const newHeader = encoder.createHeader(roots);
    if (fdReader.pos !== newHeader.length) {
      throw new Error(`updateRoots() can only overwrite a header of the same length (old header is ${ fdReader.pos } bytes, new header is ${ newHeader.length } bytes)`);
    }
    if (typeof fd === 'number') {
      await fswrite(fd, newHeader, 0, newHeader.length, 0);
    } else if (typeof fd === 'object' && typeof fd.read === 'function') {
      await fd.write(newHeader, 0, newHeader.length, 0);
    }
  }
}
const __browser = false;

exports.CarWriter = CarWriter;
exports.__browser = __browser;
