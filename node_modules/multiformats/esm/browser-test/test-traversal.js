import * as codec from '../src/codecs/json.js';
import * as dagPB from '@ipld/dag-pb';
import { sha256 as hasher } from '../src/hashes/sha2-browser.js';
import * as main from '../src/block.js';
import { walk } from '../src/traversal.js';
import { assert } from 'chai';
import { fromString } from '../src/bytes.js';
const {createLink, createNode} = dagPB;
describe('traversal', () => {
  describe('walk', async () => {
    const linksE = [];
    const valueE = createNode(fromString('string E qacdswa'), linksE);
    const blockE = await main.encode({
      value: valueE,
      codec,
      hasher
    });
    const cidE = blockE.cid;
    const linksD = [];
    const valueD = createNode(fromString('string D zasa'), linksD);
    const blockD = await main.encode({
      value: valueD,
      codec,
      hasher
    });
    const cidD = blockD.cid;
    const linksC = [
      createLink('link1', 100, cidD),
      createLink('link2', 100, cidE)
    ];
    const valueC = createNode(fromString('string C zxc'), linksC);
    const blockC = await main.encode({
      value: valueC,
      codec,
      hasher
    });
    const cidC = blockC.cid;
    const linksB = [
      createLink('link1', 100, cidD),
      createLink('link2', 100, cidD)
    ];
    const valueB = createNode(fromString('string B lpokjiasd'), linksB);
    const blockB = await main.encode({
      value: valueB,
      codec,
      hasher
    });
    const cidB = blockB.cid;
    const linksA = [
      createLink('link1', 100, cidB),
      createLink('link2', 100, cidC)
    ];
    const valueA = createNode(fromString('string A qwertcfdgshaa'), linksA);
    const blockA = await main.encode({
      value: valueA,
      codec,
      hasher
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
      await walk({
        cid: cidD,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('block with links', async () => {
      const expectedCallArray = [
        cidC.toString(),
        cidD.toString(),
        cidE.toString()
      ];
      const callArray = [];
      await walk({
        cid: cidC,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('block with matching links', async () => {
      const expectedCallArray = [
        cidB.toString(),
        cidD.toString()
      ];
      const callArray = [];
      await walk({
        cid: cidB,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index]);
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
      await walk({
        cid: cidA,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index]);
      });
    });
    it('null return', async () => {
      const links = [];
      const value = createNode(fromString('test'), links);
      const block = await main.encode({
        value,
        codec,
        hasher
      });
      const cid = block.cid;
      const expectedCallArray = [cid.toString()];
      const callArray = [];
      await walk({
        cid,
        load: loadWrapper(load, callArray)
      });
      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index]);
      });
    });
  });
});