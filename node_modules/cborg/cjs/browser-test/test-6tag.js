'use strict';

var chai = require('chai');
var token = require('../lib/token.js');
require('../cborg.js');
var byteUtils = require('../lib/byte-utils.js');
var common = require('./common.js');
var encode = require('../lib/encode.js');
var decode = require('../lib/decode.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);

const {assert} = chai__default["default"];
function Uint16ArrayDecoder(obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 23');
  }
  const u8a = byteUtils.fromHex(obj);
  return new Uint16Array(u8a.buffer, u8a.byteOffset, u8a.length / 2);
}
function Uint16ArrayEncoder(obj) {
  if (!(obj instanceof Uint16Array)) {
    throw new Error('expected Uint16Array for "Uint16Array" encoder');
  }
  return [
    new token.Token(token.Type.tag, 23),
    new token.Token(token.Type.string, byteUtils.toHex(obj))
  ];
}
describe('tag', () => {
  it('date', () => {
    assert.throws(() => encode.encode({ d: new Date() }), /unsupported type: Date/);
    assert.equal(byteUtils.toHex(encode.encode(new Date('2013-03-21T20:04:00Z'), { typeEncoders: { Date: common.dateEncoder } })), 'c074323031332d30332d32315432303a30343a30305a');
    const decodedDate = decode.decode(byteUtils.fromHex('c074323031332d30332d32315432303a30343a30305a'), { tags: { 0: common.dateDecoder } });
    assert.instanceOf(decodedDate, Date);
    assert.equal(decodedDate.toISOString(), new Date('2013-03-21T20:04:00Z').toISOString());
  });
  it('Uint16Array as hex/23 (overide existing type)', () => {
    assert.equal(byteUtils.toHex(encode.encode(Uint16Array.from([
      1,
      2,
      3
    ]), { typeEncoders: { Uint16Array: Uint16ArrayEncoder } })), 'd76c303130303032303030333030');
    const decoded = decode.decode(byteUtils.fromHex('d76c303130303032303030333030'), { tags: { 23: Uint16ArrayDecoder } });
    assert.instanceOf(decoded, Uint16Array);
    assert.equal(byteUtils.toHex(decoded), byteUtils.toHex(Uint16Array.from([
      1,
      2,
      3
    ])));
  });
  it('tag int too large', () => {
    const verify = (hex, strict) => {
      if (!strict) {
        assert.throws(() => decode.decode(byteUtils.fromHex(hex), {
          tags: { 8: common.dateDecoder },
          strict: true
        }), /integer encoded in more bytes than necessary/);
      }
      const decodedDate = decode.decode(byteUtils.fromHex(hex), {
        tags: { 8: common.dateDecoder },
        strict
      });
      assert.instanceOf(decodedDate, Date);
      assert.equal(decodedDate.toISOString(), new Date('2013-03-21T20:04:00Z').toISOString());
    };
    verify('c874323031332d30332d32315432303a30343a30305a', true);
    verify('d80874323031332d30332d32315432303a30343a30305a', false);
    verify('d9000874323031332d30332d32315432303a30343a30305a', false);
    verify('da0000000874323031332d30332d32315432303a30343a30305a', false);
    verify('db000000000000000874323031332d30332d32315432303a30343a30305a', false);
  });
});
