'use strict';

var bytes = require('../src/bytes.js');
var raw = require('../src/codecs/raw.js');
var json = require('../src/codecs/json.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);
var chaiAsPromised__default = /*#__PURE__*/_interopDefaultLegacy(chaiAsPromised);

chai__default["default"].use(chaiAsPromised__default["default"]);
const {assert} = chai__default["default"];
describe('multicodec', () => {
  it('encode/decode raw', () => {
    const buff = raw.encode(bytes.fromString('test'));
    assert.deepStrictEqual(buff, bytes.fromString('test'));
    assert.deepStrictEqual(raw.decode(buff), bytes.fromString('test'));
  });
  it('encode/decode json', () => {
    const buff = json.encode({ hello: 'world' });
    assert.deepStrictEqual(buff, bytes.fromString(JSON.stringify({ hello: 'world' })));
    assert.deepStrictEqual(json.decode(buff), { hello: 'world' });
  });
  it('raw cannot encode string', async () => {
    assert.throws(() => raw.encode('asdf'), 'Unknown type, must be binary type');
  });
});
