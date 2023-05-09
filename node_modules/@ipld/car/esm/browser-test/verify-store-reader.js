import { bytes } from 'multiformats';
import * as raw from 'multiformats/codecs/raw';
import {
  toBlock,
  assert,
  makeData
} from './common.js';
function compareBlockData(actual, expected, id) {
  assert.strictEqual(bytes.toHex(actual.bytes), bytes.toHex(expected.bytes), `comparing block as hex ${ id || '' }`);
}
function compareCids(actual, expected) {
  assert.strictEqual(actual.toString(), expected.toString());
}
async function verifyRoots(reader) {
  const {cborBlocks} = await makeData();
  const expected = [
    cborBlocks[0].cid.toString(),
    cborBlocks[1].cid.toString()
  ];
  assert.deepStrictEqual((await reader.getRoots()).map(c => c.toString()), expected);
}
async function verifyHas(reader) {
  const {allBlocks} = await makeData();
  const verifyHas = async (cid, name) => {
    assert.ok(await reader.has(cid), `reader doesn't have expected key for ${ name }`);
  };
  const verifyHasnt = async (cid, name) => {
    assert.ok(!await reader.has(cid), `reader has unexpected key for ${ name }`);
    assert.strictEqual(await reader.get(cid), undefined);
  };
  for (const [type, blocks] of allBlocks) {
    for (let i = 0; i < blocks.length; i++) {
      await verifyHas(blocks[i].cid, `block #${ i } (${ type } / ${ blocks[i].cid })`);
    }
  }
  await verifyHasnt((await toBlock(new TextEncoder().encode('dddd'), raw)).cid, 'dddd');
}
async function verifyGet(reader) {
  const {allBlocks} = await makeData();
  const verifyBlock = async (expected, index, type) => {
    let actual;
    try {
      actual = await reader.get(expected.cid);
      assert.isDefined(actual);
      if (actual) {
        compareBlockData(actual, expected, `#${ index } (${ type })`);
      }
    } catch (err) {
      assert.ifError(err, `get block length #${ index } (${ type })`);
    }
  };
  for (const [type, blocks] of allBlocks) {
    for (let i = 0; i < blocks.length; i++) {
      await verifyBlock(blocks[i], i, type);
    }
  }
}
async function verifyBlocks(iterator, unordered) {
  const {allBlocksFlattened} = await makeData();
  if (!unordered) {
    const expected = allBlocksFlattened.slice();
    for await (const actual of iterator) {
      const next = expected.shift();
      assert.isDefined(next);
      if (next) {
        compareBlockData(actual, next);
      }
    }
  } else {
    const expected = {};
    for (const block of allBlocksFlattened) {
      expected[block.cid.toString()] = block;
    }
    for await (const actual of iterator) {
      const {cid} = actual;
      const exp = expected[cid.toString()];
      if (!exp) {
        throw new Error(`Unexpected block: ${ cid.toString() }`);
      }
      compareBlockData(actual, exp);
      delete expected[cid.toString()];
    }
    if (Object.keys(expected).length) {
      throw new Error('Did not find all expected blocks');
    }
  }
}
async function verifyCids(iterator, unordered) {
  const {allBlocksFlattened} = await makeData();
  if (!unordered) {
    const expected = allBlocksFlattened.slice();
    for await (const actual of iterator) {
      const next = expected.shift();
      assert.isDefined(next);
      if (next) {
        compareCids(actual, next.cid);
      }
    }
  } else {
    const expected = {};
    for (const block of allBlocksFlattened) {
      expected[block.cid.toString()] = block;
    }
    for await (const cid of iterator) {
      const exp = expected[cid.toString()];
      if (!exp) {
        throw new Error(`Unexpected cid: ${ cid.toString() }`);
      }
      delete expected[cid.toString()];
    }
    if (Object.keys(expected).length) {
      throw new Error('Did not find all expected cids');
    }
  }
}
export {
  verifyRoots,
  verifyHas,
  verifyGet,
  verifyBlocks,
  verifyCids
};