'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var multiformats = require('multiformats');
var sha2 = require('multiformats/hashes/sha2');
var raw = require('multiformats/codecs/raw');
var dagCbor = require('@ipld/dag-cbor');
var dagPb = require('@ipld/dag-pb');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

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
var dagCbor__namespace = /*#__PURE__*/_interopNamespace(dagCbor);
var dagPb__namespace = /*#__PURE__*/_interopNamespace(dagPb);
var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);
var chaiAsPromised__default = /*#__PURE__*/_interopDefaultLegacy(chaiAsPromised);

class TestBlock {
  constructor(bytes, cid, object) {
    this.bytes = bytes;
    this.cid = cid;
    this.object = object;
  }
}
chai__default["default"].use(chaiAsPromised__default["default"]);
const {assert} = chai__default["default"];
let rawBlocks;
const pbBlocks = [];
const cborBlocks = [];
let allBlocks;
let allBlocksFlattened;
const rndCid = multiformats.CID.parse('bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm');
async function toBlock(object, codec, version = 1) {
  const bytes = codec.encode(object);
  const hash = await sha2.sha256.digest(bytes);
  const cid = multiformats.CID.create(version, codec.code, hash);
  return new TestBlock(bytes, cid, object);
}
async function makeData() {
  if (!rawBlocks) {
    rawBlocks = await Promise.all('aaaa bbbb cccc zzzz'.split(' ').map(s => {
      return toBlock(new TextEncoder().encode(s), raw__namespace);
    }));
    const toPbLink = (name, block) => {
      let size = block.bytes.length;
      if (block.cid.code === 112) {
        const node = block.object;
        size = node.Links.reduce((p, c) => p + (c.Tsize || 0), size);
      }
      return {
        Name: name,
        Tsize: size,
        Hash: block.cid
      };
    };
    pbBlocks.push(await toBlock({ Links: [toPbLink('cat', rawBlocks[0])] }, dagPb__namespace, 0));
    pbBlocks.push(await toBlock({
      Links: [
        toPbLink('dog', rawBlocks[1]),
        toPbLink('first', pbBlocks[0])
      ]
    }, dagPb__namespace, 0));
    pbBlocks.push(await toBlock({
      Links: [
        toPbLink('bear', rawBlocks[2]),
        toPbLink('second', pbBlocks[1])
      ]
    }, dagPb__namespace, 0));
    const cbstructs = [
      [
        'blip',
        pbBlocks[2].cid
      ],
      [
        'limbo',
        null
      ]
    ];
    for (const b of cbstructs) {
      cborBlocks.push(await toBlock({
        name: b[0],
        link: b[1]
      }, dagCbor__namespace));
    }
    allBlocks = [
      [
        'raw',
        rawBlocks.slice(0, 3)
      ],
      [
        'pb',
        pbBlocks
      ],
      [
        'cbor',
        cborBlocks
      ]
    ];
    allBlocksFlattened = allBlocks.reduce((p, c) => p.concat(c[1]), []);
  }
  return {
    rawBlocks,
    pbBlocks,
    cborBlocks,
    allBlocks,
    allBlocksFlattened
  };
}
function makeIterable(data, chunkSize) {
  let pos = 0;
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          await new Promise(resolve => setTimeout(resolve, 5));
          if (pos >= data.length) {
            return {
              done: true,
              value: undefined
            };
          }
          const value = data.slice(pos, pos += chunkSize);
          return {
            done: false,
            value
          };
        }
      };
    }
  };
}
const carBytes = multiformats.bytes.fromHex('63a265726f6f747382d82a58250001711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8bd82a5825000171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365b6776657273696f6e01280155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b461616161280155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e646877626262622801551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a2745163636363511220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d0122d0a240155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b4120363617418048001122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a122d0a240155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e6468771203646f671804122d0a221220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d01205666972737418338301122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de122e0a2401551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a274511204626561721804122f0a22122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a12067365636f6e641895015b01711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8ba2646c696e6bd82a582300122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de646e616d6564626c6970360171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365ba2646c696e6bf6646e616d65656c696d626f');
const goCarBytes = multiformats.bytes.fromHex('63a265726f6f747382d82a58250001711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8bd82a5825000171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365b6776657273696f6e015b01711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8ba2646c696e6bd82a582300122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de646e616d6564626c69708301122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de122e0a2401551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a274511204626561721804122f0a22122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a12067365636f6e641895012801551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a27451636363638001122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a122d0a240155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e6468771203646f671804122d0a221220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d0120566697273741833280155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e64687762626262511220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d0122d0a240155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b412036361741804280155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b461616161360171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365ba2646c696e6bf6646e616d65656c696d626f');
const goCarRoots = [
  multiformats.CID.parse('bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm'),
  multiformats.CID.parse('bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm')
];
const goCarIndex = [
  {
    cid: multiformats.CID.parse('bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm'),
    offset: 100,
    length: 92,
    blockOffset: 137,
    blockLength: 55
  },
  {
    cid: multiformats.CID.parse('QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d'),
    offset: 192,
    length: 133,
    blockOffset: 228,
    blockLength: 97
  },
  {
    cid: multiformats.CID.parse('bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke'),
    offset: 325,
    length: 41,
    blockOffset: 362,
    blockLength: 4
  },
  {
    cid: multiformats.CID.parse('QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys'),
    offset: 366,
    length: 130,
    blockOffset: 402,
    blockLength: 94
  },
  {
    cid: multiformats.CID.parse('bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4'),
    offset: 496,
    length: 41,
    blockOffset: 533,
    blockLength: 4
  },
  {
    cid: multiformats.CID.parse('QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT'),
    offset: 537,
    length: 82,
    blockOffset: 572,
    blockLength: 47
  },
  {
    cid: multiformats.CID.parse('bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq'),
    offset: 619,
    length: 41,
    blockOffset: 656,
    blockLength: 4
  },
  {
    cid: multiformats.CID.parse('bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm'),
    offset: 660,
    length: 55,
    blockOffset: 697,
    blockLength: 18
  }
];

exports.assert = assert;
exports.carBytes = carBytes;
exports.goCarBytes = goCarBytes;
exports.goCarIndex = goCarIndex;
exports.goCarRoots = goCarRoots;
exports.makeData = makeData;
exports.makeIterable = makeIterable;
exports.rndCid = rndCid;
exports.toBlock = toBlock;
