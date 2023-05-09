'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var util = require('util');
var readerBrowser = require('./reader-browser.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const fsread = util.promisify(fs__default["default"].read);
class CarReader extends readerBrowser.CarReader {
  static async readRaw(fd, blockIndex) {
    const {cid, blockLength, blockOffset} = blockIndex;
    const bytes = new Uint8Array(blockLength);
    let read;
    if (typeof fd === 'number') {
      read = (await fsread(fd, bytes, 0, blockLength, blockOffset)).bytesRead;
    } else if (typeof fd === 'object' && typeof fd.read === 'function') {
      read = (await fd.read(bytes, 0, blockLength, blockOffset)).bytesRead;
    } else {
      throw new TypeError('Bad fd');
    }
    if (read !== blockLength) {
      throw new Error(`Failed to read entire block (${ read } instead of ${ blockLength })`);
    }
    return {
      cid,
      bytes
    };
  }
}
const __browser = false;

exports.CarReader = CarReader;
exports.__browser = __browser;
