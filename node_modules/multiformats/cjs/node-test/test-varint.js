'use strict';

require('../src/index.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var varint = require('../src/varint.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);
var chaiAsPromised__default = /*#__PURE__*/_interopDefaultLegacy(chaiAsPromised);

chai__default["default"].use(chaiAsPromised__default["default"]);
const {assert} = chai__default["default"];
const UTF8 = new TextEncoder();
describe('varint', () => {
  it('can decode with offset', () => {
    const message = UTF8.encode('hello-world');
    const outerTag = 85;
    const innerTag = 227;
    const outerTagSize = varint.encodingLength(outerTag);
    const innerTagSize = varint.encodingLength(innerTag);
    const bytes = new Uint8Array(message.byteLength + outerTagSize + innerTagSize);
    varint.encodeTo(outerTag, bytes);
    varint.encodeTo(innerTag, bytes, outerTagSize);
    bytes.set(message, outerTagSize + innerTagSize);
    assert.deepStrictEqual(varint.decode(bytes), [
      outerTag,
      outerTagSize
    ]);
    assert.deepStrictEqual(varint.decode(bytes, outerTagSize), [
      innerTag,
      innerTagSize
    ]);
  });
});
