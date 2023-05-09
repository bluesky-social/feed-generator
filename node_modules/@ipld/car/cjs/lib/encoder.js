'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var varint = require('varint');
var dagCbor = require('@ipld/dag-cbor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var varint__default = /*#__PURE__*/_interopDefaultLegacy(varint);

function createHeader(roots) {
  const headerBytes = dagCbor.encode({
    version: 1,
    roots
  });
  const varintBytes = varint__default["default"].encode(headerBytes.length);
  const header = new Uint8Array(varintBytes.length + headerBytes.length);
  header.set(varintBytes, 0);
  header.set(headerBytes, varintBytes.length);
  return header;
}
function createEncoder(writer) {
  return {
    async setRoots(roots) {
      const bytes = createHeader(roots);
      await writer.write(bytes);
    },
    async writeBlock(block) {
      const {cid, bytes} = block;
      await writer.write(new Uint8Array(varint__default["default"].encode(cid.bytes.length + bytes.length)));
      await writer.write(cid.bytes);
      if (bytes.length) {
        await writer.write(bytes);
      }
    },
    async close() {
      return writer.end();
    }
  };
}

exports.createEncoder = createEncoder;
exports.createHeader = createHeader;
