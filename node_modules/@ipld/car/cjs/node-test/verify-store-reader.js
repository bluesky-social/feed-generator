'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var multiformats = require('multiformats');
var raw = require('multiformats/codecs/raw');
var common = require('./common.js');

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

var raw__namespace = /*#__PURE__*/_interopNamespace(raw);

function compareBlockData(actual, expected, id) {
  common.assert.strictEqual(multiformats.bytes.toHex(actual.bytes), multiformats.bytes.toHex(expected.bytes), `comparing block as hex ${ id || '' }`);
}
function compareCids(actual, expected) {
  common.assert.strictEqual(actual.toString(), expected.toString());
}
async function verifyRoots(reader) {
  const {cborBlocks} = await common.makeData();
  const expected = [
    cborBlocks[0].cid.toString(),
    cborBlocks[1].cid.toString()
  ];
  common.assert.deepStrictEqual((await reader.getRoots()).map(c => c.toString()), expected);
}
async function verifyHas(reader) {
  const {allBlocks} = await common.makeData();
  const verifyHas = async (cid, name) => {
    common.assert.ok(await reader.has(cid), `reader doesn't have expected key for ${ name }`);
  };
  const verifyHasnt = async (cid, name) => {
    common.assert.ok(!await reader.has(cid), `reader has unexpected key for ${ name }`);
    common.assert.strictEqual(await reader.get(cid), undefined);
  };
  for (const [type, blocks] of allBlocks) {
    for (let i = 0; i < blocks.length; i++) {
      await verifyHas(blocks[i].cid, `block #${ i } (${ type } / ${ blocks[i].cid })`);
    }
  }
  await verifyHasnt((await common.toBlock(new TextEncoder().encode('dddd'), raw__namespace)).cid, 'dddd');
}
async function verifyGet(reader) {
  const {allBlocks} = await common.makeData();
  const verifyBlock = async (expected, index, type) => {
    let actual;
    try {
      actual = await reader.get(expected.cid);
      common.assert.isDefined(actual);
      if (actual) {
        compareBlockData(actual, expected, `#${ index } (${ type })`);
      }
    } catch (err) {
      common.assert.ifError(err, `get block length #${ index } (${ type })`);
    }
  };
  for (const [type, blocks] of allBlocks) {
    for (let i = 0; i < blocks.length; i++) {
      await verifyBlock(blocks[i], i, type);
    }
  }
}
async function verifyBlocks(iterator, unordered) {
  const {allBlocksFlattened} = await common.makeData();
  if (!unordered) {
    const expected = allBlocksFlattened.slice();
    for await (const actual of iterator) {
      const next = expected.shift();
      common.assert.isDefined(next);
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
  const {allBlocksFlattened} = await common.makeData();
  if (!unordered) {
    const expected = allBlocksFlattened.slice();
    for await (const actual of iterator) {
      const next = expected.shift();
      common.assert.isDefined(next);
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

exports.verifyBlocks = verifyBlocks;
exports.verifyCids = verifyCids;
exports.verifyGet = verifyGet;
exports.verifyHas = verifyHas;
exports.verifyRoots = verifyRoots;
