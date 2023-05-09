'use strict';

var json = require('../src/codecs/json.js');
var dagPB = require('@ipld/dag-pb');
var sha2Browser = require('../src/hashes/sha2-browser.js');
var block = require('../src/block.js');
var traversal = require('../src/traversal.js');
var chai = require('chai');
var bytes = require('../src/bytes.js');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var dagPB__namespace = /*#__PURE__*/_interopNamespace(dagPB);

const {createLink, createNode} = dagPB__namespace;
describe('traversal', () => {
  describe('walk', async () => {
    const linksE = [];
    const valueE = createNode(bytes.fromString('string E qacdswa'), linksE);
    const blockE = await block.encode({
      value: valueE,
      codec: json,
      hasher: sha2Browser.sha256
    });
    const cidE = blockE.cid;
    const linksD = [];
    const valueD = createNode(bytes.fromString('string D zasa'), linksD);
    const blockD = await block.encode({
      value: valueD,
      codec: json,
      hasher: sha2Browser.sha256
    });
    const cidD = blockD.cid;
    const linksC = [
      createLink('link1', 100, cidD),
      createLink('link2', 100, cidE)
    ];
    const valueC = createNode(bytes.fromString('string C zxc'), linksC);
    const blockC = await block.encode({
      value: valueC,
      codec: json,
      hasher: sha2Browser.sha256
    });
    const cidC = blockC.cid;
    const linksB = [
      createLink('link1', 100, cidD),
      createLink('link2', 100, cidD)
    ];
    const valueB = createNode(bytes.fromString('string B lpokjiasd'), linksB);
    const blockB = await block.encode({
      value: valueB,
      codec: json,
      hasher: sha2Browser.sha256
    });
    const cidB = blockB.cid;
    const linksA = [
      createLink('link1', 100, cidB),
      createLink('link2', 100, cidC)
    ];
    const valueA = createNode(bytes.fromString('string A qwertcfdgshaa'), linksA);
    const blockA = await block.encode({
      value: valueA,
      codec: json,
      hasher: sha2Browser.sha256
    });
    const cidA = blockA.cid;
    const load = async cid => {
      if (cid.equals(cidE)) {
        return blockE;
      }
      if (cid.equals(cidD)) {
        return blockD;
      }
      if (cid.equals(cidC)) {
        return blockC;
      }
      if (cid.equals(cidB)) {
        return blockB;
      }
      if (cid.equals(cidA)) {
        return blockA;
      }
      return null;
    };
    const loadWrapper = (load, arr = []) => cid => {
      arr.push(cid.toString());
      return load(cid);
    };
    it('block with no links', async () => {
      const expectedCallArray = [cidD.toString()];
      const callArray = [];
      await traversal.walk({
        cid: cidD,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        chai.assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('block with links', async () => {
      const expectedCallArray = [
        cidC.toString(),
        cidD.toString(),
        cidE.toString()
      ];
      const callArray = [];
      await traversal.walk({
        cid: cidC,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        chai.assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('block with matching links', async () => {
      const expectedCallArray = [
        cidB.toString(),
        cidD.toString()
      ];
      const callArray = [];
      await traversal.walk({
        cid: cidB,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        chai.assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('depth first with duplicated block', async () => {
      const expectedCallArray = [
        cidA.toString(),
        cidB.toString(),
        cidD.toString(),
        cidC.toString(),
        cidE.toString()
      ];
      const callArray = [];
      await traversal.walk({
        cid: cidA,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        chai.assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('null return', async () => {
      const links = [];
      const value = createNode(bytes.fromString('test'), links);
      const block$1 = await block.encode({
        value,
        codec: json,
        hasher: sha2Browser.sha256
      });
      const cid = block$1.cid;
      const expectedCallArray = [cid.toString()];
      const callArray = [];
      await traversal.walk({
        cid,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        chai.assert.deepStrictEqual(value, callArray[index]);
      });
    });
  });
});
