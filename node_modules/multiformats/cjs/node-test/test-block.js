'use strict';

var json = require('../src/codecs/json.js');
var sha2 = require('../src/hashes/sha2.js');
var block = require('../src/block.js');
require('../src/index.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var cid = require('../src/cid.js');
var bytes = require('../src/bytes.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);
var chaiAsPromised__default = /*#__PURE__*/_interopDefaultLegacy(chaiAsPromised);

chai__default["default"].use(chaiAsPromised__default["default"]);
const {assert} = chai__default["default"];
const fixture = { hello: 'world' };
const link = cid.CID.parse('bafyreidykglsfhoixmivffc5uwhcgshx4j465xwqntbmu43nb2dzqwfvae');
const buff = bytes.fromString('sadf');
describe('block', () => {
  it('basic encode/decode roundtrip', async () => {
    const block$1 = await block.encode({
      value: fixture,
      codec: json,
      hasher: sha2.sha256
    });
    const block2 = await block.decode({
      bytes: block$1.bytes,
      codec: json,
      hasher: sha2.sha256
    });
    assert.deepStrictEqual(block$1.cid.equals(block2.cid), true);
    assert.deepStrictEqual(block$1.cid.equals(block2.cid), true);
    assert.deepStrictEqual(fixture, block2.value);
    const block3 = await block.create({
      bytes: block$1.bytes,
      cid: block$1.cid,
      codec: json,
      hasher: sha2.sha256
    });
    assert.deepStrictEqual(block3.cid.equals(block2.cid), true);
  });
  it('createUnsafe', async () => {
    const block$1 = await block.encode({
      value: fixture,
      codec: json,
      hasher: sha2.sha256
    });
    const block2 = block.createUnsafe({
      bytes: block$1.bytes,
      cid: block$1.cid,
      codec: json
    });
    assert.deepStrictEqual(block$1.cid.equals(block2.cid), true);
  });
  describe('reader', () => {
    const value = {
      link,
      nope: 'skip',
      arr: [link],
      obj: { arr: [{ obj: {} }] },
      bytes: Uint8Array.from('1234')
    };
    const block$1 = block.createUnsafe({
      value,
      codec: json,
      hasher: sha2.sha256,
      cid: true,
      bytes: true
    });
    it('links', () => {
      const expected = [
        'link',
        'arr/0'
      ];
      for (const [path, cid] of block$1.links()) {
        assert.deepStrictEqual(path, expected.shift());
        assert.deepStrictEqual(cid.toString(), link.toString());
      }
    });
    it('tree', () => {
      const expected = [
        'link',
        'nope',
        'arr',
        'arr/0',
        'obj',
        'obj/arr',
        'obj/arr/0',
        'obj/arr/0/obj',
        'bytes'
      ];
      for (const path of block$1.tree()) {
        assert.deepStrictEqual(path, expected.shift());
      }
    });
    it('get', () => {
      let ret = block$1.get('link/test');
      assert.deepStrictEqual(ret.remaining, 'test');
      assert.deepStrictEqual(ret.value.toString(), link.toString());
      ret = block$1.get('nope');
      assert.deepStrictEqual(ret, { value: 'skip' });
    });
    it('null links/tree', () => {
      const block$1 = block.createUnsafe({
        value: null,
        codec: json,
        hasher: sha2.sha256,
        bytes: true,
        cid: true
      });
      for (const x of block$1.tree()) {
        throw new Error(`tree should have nothing, got "${ x }"`);
      }
      for (const x of block$1.links()) {
        throw new Error(`links should have nothing, got "${ x }"`);
      }
    });
  });
  it('kitchen sink', () => {
    const sink = {
      one: {
        two: {
          arr: [
            true,
            false,
            null
          ],
          three: 3,
          buff,
          link
        }
      }
    };
    const block$1 = block.createUnsafe({
      value: sink,
      codec: json,
      bytes: true,
      cid: true
    });
    assert.deepStrictEqual(sink, block$1.value);
  });
  describe('errors', () => {
    it('constructor missing args', () => {
      assert.throws(() => new block.Block({}), 'Missing required argument');
    });
    it('encode', async () => {
      await assert.isRejected(block.encode({}), 'Missing required argument "value"');
      await assert.isRejected(block.encode({ value: true }), 'Missing required argument: codec or hasher');
    });
    it('decode', async () => {
      await assert.isRejected(block.decode({}), 'Missing required argument "bytes"');
      await assert.isRejected(block.decode({ bytes: true }), 'Missing required argument: codec or hasher');
    });
    it('createUnsafe', async () => {
      assert.throws(() => block.createUnsafe({}), 'Missing required argument, must either provide "value" or "codec"');
    });
    it('create', async () => {
      await assert.isRejected(block.create({}), 'Missing required argument "bytes"');
      await assert.isRejected(block.create({ bytes: true }), 'Missing required argument "hasher"');
      const block$1 = await block.encode({
        value: fixture,
        codec: json,
        hasher: sha2.sha256
      });
      const block2 = await block.encode({
        value: {
          ...fixture,
          test: 'blah'
        },
        codec: json,
        hasher: sha2.sha256
      });
      await assert.isRejected(block.create({
        bytes: block$1.bytes,
        cid: block2.cid,
        codec: json,
        hasher: sha2.sha256
      }), 'CID hash does not match bytes');
    });
    it('get', async () => {
      const block$1 = await block.encode({
        value: fixture,
        codec: json,
        hasher: sha2.sha256
      });
      assert.throws(() => block$1.get('/asd/fs/dfasd/f'), 'Object has no property at ["asd"]');
    });
  });
});
