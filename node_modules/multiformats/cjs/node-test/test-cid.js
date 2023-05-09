'use strict';

var OLDCID = require('cids');
var bytes = require('../src/bytes.js');
require('../src/index.js');
var base58 = require('../src/bases/base58.js');
var base32 = require('../src/bases/base32.js');
var base64 = require('../src/bases/base64.js');
var sha2 = require('../src/hashes/sha2.js');
var invalidMultihash = require('./fixtures/invalid-multihash.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var cid = require('../src/cid.js');
var varint = require('../src/varint.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var OLDCID__default = /*#__PURE__*/_interopDefaultLegacy(OLDCID);
var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);
var chaiAsPromised__default = /*#__PURE__*/_interopDefaultLegacy(chaiAsPromised);

chai__default["default"].use(chaiAsPromised__default["default"]);
const {assert} = chai__default["default"];
const textEncoder = new TextEncoder();
describe('CID', () => {
  describe('v0', () => {
    it('handles B58Str multihash', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
      const cid$1 = cid.CID.parse(mhStr);
      assert.deepStrictEqual(cid$1.version, 0);
      assert.deepStrictEqual(cid$1.code, 112);
      assert.deepStrictEqual(cid$1.multihash.bytes, base58.base58btc.baseDecode(mhStr));
      assert.deepStrictEqual(cid$1.toString(), mhStr);
    });
    it('create by parts', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(0, 112, hash);
      assert.deepStrictEqual(cid$1.code, 112);
      assert.deepStrictEqual(cid$1.version, 0);
      assert.deepStrictEqual(cid$1.multihash, hash);
      assert.deepStrictEqual(cid$1.toString(), base58.base58btc.baseEncode(hash.bytes));
    });
    it('create from multihash', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.decode(hash.bytes);
      assert.deepStrictEqual(cid$1.code, 112);
      assert.deepStrictEqual(cid$1.version, 0);
      assert.deepStrictEqual(cid$1.multihash.digest, hash.digest);
      assert.deepStrictEqual({
        ...cid$1.multihash,
        digest: null
      }, {
        ...hash,
        digest: null
      });
      cid$1.toString();
      assert.deepStrictEqual(cid$1.toString(), base58.base58btc.baseEncode(hash.bytes));
    });
    it('throws on invalid BS58Str multihash ', async () => {
      const msg = 'Non-base58btc character';
      assert.throws(() => cid.CID.parse('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zIII'), msg);
    });
    it('throws on trying to create a CIDv0 with a codec other than dag-pb', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const msg = 'Version 0 CID must use dag-pb (code: 112) block encoding';
      assert.throws(() => cid.CID.create(0, 113, hash), msg);
    });
    it('throws on trying to base encode CIDv0 in other base than base58btc', async () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
      const cid$1 = cid.CID.parse(mhStr);
      const msg = 'Cannot string encode V0 in base32 encoding';
      assert.throws(() => cid$1.toString(base32.base32), msg);
    });
    it('.bytes', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const codec = 112;
      const cid$1 = cid.CID.create(0, codec, hash);
      const bytes$1 = cid$1.bytes;
      assert.ok(bytes$1);
      const str = bytes.toHex(bytes$1);
      assert.deepStrictEqual(str, '1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
    it('should construct from an old CID', () => {
      const cidStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
      const oldCid = cid.CID.parse(cidStr);
      const newCid = cid.CID.asCID(oldCid);
      assert.deepStrictEqual(newCid.toString(), cidStr);
    });
    it('inspect bytes', () => {
      const byts = bytes.fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      const inspected = cid.CID.inspectBytes(byts.subarray(0, 10));
      assert.deepStrictEqual({
        version: 0,
        codec: 112,
        multihashCode: 18,
        multihashSize: 34,
        digestSize: 32,
        size: 34
      }, inspected);
    });
    describe('decodeFirst', () => {
      it('no remainder', () => {
        const byts = bytes.fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        const [cid$1, remainder] = cid.CID.decodeFirst(byts);
        assert.deepStrictEqual(cid$1.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY');
        assert.deepStrictEqual(remainder.byteLength, 0);
      });
      it('remainder', () => {
        const byts = bytes.fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad0102030405');
        const [cid$1, remainder] = cid.CID.decodeFirst(byts);
        assert.deepStrictEqual(cid$1.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY');
        assert.deepStrictEqual(bytes.toHex(remainder), '0102030405');
      });
    });
  });
  describe('v1', () => {
    it('handles CID String (multibase encoded)', () => {
      const cidStr = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS';
      const cid$1 = cid.CID.parse(cidStr);
      assert.deepStrictEqual(cid$1.code, 112);
      assert.deepStrictEqual(cid$1.version, 1);
      assert.ok(cid$1.multihash);
      assert.deepStrictEqual(cid$1.toString(), base32.base32.encode(cid$1.bytes));
    });
    it('handles CID (no multibase)', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u';
      const cidBuf = bytes.fromHex('017012207252523e6591fb8fe553d67ff55a86f84044b46a3e4176e10c58fa529a4aabd5');
      const cid$1 = cid.CID.decode(cidBuf);
      assert.deepStrictEqual(cid$1.code, 112);
      assert.deepStrictEqual(cid$1.version, 1);
      assert.deepStrictEqual(cid$1.toString(), cidStr);
    });
    it('create by parts', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 113, hash);
      assert.deepStrictEqual(cid$1.code, 113);
      assert.deepStrictEqual(cid$1.version, 1);
      equalDigest(cid$1.multihash, hash);
    });
    it('can roundtrip through cid.toString()', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid1 = cid.CID.create(1, 113, hash);
      const cid2 = cid.CID.parse(cid1.toString());
      assert.deepStrictEqual(cid1.code, cid2.code);
      assert.deepStrictEqual(cid1.version, cid2.version);
      assert.deepStrictEqual(cid1.multihash.digest, cid2.multihash.digest);
      assert.deepStrictEqual(cid1.multihash.bytes, cid2.multihash.bytes);
      const clear = {
        digest: null,
        bytes: null
      };
      assert.deepStrictEqual({
        ...cid1.multihash,
        ...clear
      }, {
        ...cid2.multihash,
        ...clear
      });
    });
    it('.bytes', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const code = 113;
      const cid$1 = cid.CID.create(1, code, hash);
      const bytes$1 = cid$1.bytes;
      assert.ok(bytes$1);
      const str = bytes.toHex(bytes$1);
      assert.deepStrictEqual(str, '01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
    it('should construct from an old CID without a multibaseName', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u';
      const oldCid = cid.CID.parse(cidStr);
      const newCid = cid.CID.asCID(oldCid);
      assert.deepStrictEqual(newCid.toString(), cidStr);
    });
  });
  describe('utilities', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
    const h2 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1o';
    const h3 = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS';
    it('.equals v0 to v0', () => {
      const cid1 = cid.CID.parse(h1);
      assert.deepStrictEqual(cid1.equals(cid.CID.parse(h1)), true);
      assert.deepStrictEqual(cid1.equals(cid.CID.create(cid1.version, cid1.code, cid1.multihash)), true);
      const cid2 = cid.CID.parse(h2);
      assert.deepStrictEqual(cid1.equals(cid.CID.parse(h2)), false);
      assert.deepStrictEqual(cid1.equals(cid.CID.create(cid2.version, cid2.code, cid2.multihash)), false);
    });
    it('.equals v0 to v1 and vice versa', () => {
      const cidV1 = cid.CID.parse(h3);
      const cidV0 = cidV1.toV0();
      assert.deepStrictEqual(cidV0.equals(cidV1), false);
      assert.deepStrictEqual(cidV1.equals(cidV0), false);
      assert.deepStrictEqual(cidV1.multihash, cidV0.multihash);
    });
    it('.equals v1 to v1', () => {
      const cid1 = cid.CID.parse(h3);
      assert.deepStrictEqual(cid1.equals(cid.CID.parse(h3)), true);
      assert.deepStrictEqual(cid1.equals(cid.CID.create(cid1.version, cid1.code, cid1.multihash)), true);
    });
    it('.isCid', () => {
      assert.ok(cid.CID.isCID(cid.CID.parse(h1)));
      assert.ok(!cid.CID.isCID(false));
      assert.ok(!cid.CID.isCID(textEncoder.encode('hello world')));
      assert.ok(cid.CID.isCID(cid.CID.parse(h1).toV0()));
      assert.ok(cid.CID.isCID(cid.CID.parse(h1).toV1()));
    });
    it('works with deepEquals', () => {
      const ch1 = cid.CID.parse(h1);
      ch1._baseCache.set('herp', 'derp');
      assert.deepStrictEqual(ch1, cid.CID.parse(h1));
      assert.notDeepEqual(ch1, cid.CID.parse(h2));
    });
  });
  describe('throws on invalid inputs', () => {
    const parse = [
      'hello world',
      'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L'
    ];
    for (const i of parse) {
      const name = `CID.parse(${ JSON.stringify(i) })`;
      it(name, async () => assert.throws(() => cid.CID.parse(i)));
    }
    const decode = [
      textEncoder.encode('hello world'),
      textEncoder.encode('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT')
    ];
    for (const i of decode) {
      const name = `CID.decode(textEncoder.encode(${ JSON.stringify(i.toString()) }))`;
      it(name, async () => assert.throws(() => cid.CID.decode(i)));
    }
    const create = [
      ...[
        ...parse,
        ...decode
      ].map(i => [
        0,
        112,
        i
      ]),
      ...[
        ...parse,
        ...decode
      ].map(i => [
        1,
        112,
        i
      ]),
      [
        18,
        112,
        'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L'
      ]
    ];
    for (const [version, code, hash] of create) {
      const form = JSON.stringify(hash.toString());
      const mh = hash instanceof Uint8Array ? `textEncoder.encode(${ form })` : form;
      const name = `CID.create(${ version }, ${ code }, ${ mh })`;
      it(name, async () => assert.throws(() => cid.CID.create(version, code, hash)));
    }
    it('invalid fixtures', async () => {
      for (const test of invalidMultihash) {
        const buff = bytes.fromHex(`0171${ test.hex }`);
        assert.throws(() => cid.CID.decode(buff), new RegExp(test.message));
      }
    });
  });
  describe('idempotence', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
    const cid1 = cid.CID.parse(h1);
    const cid2 = cid.CID.asCID(cid1);
    it('constructor accept constructed instance', () => {
      assert.deepStrictEqual(cid1 === cid2, true);
    });
  });
  describe('conversion v0 <-> v1', () => {
    it('should convert v0 to v1', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(0, 112, hash).toV1();
      assert.deepStrictEqual(cid$1.version, 1);
    });
    it('should convert v1 to v0', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(1, 112, hash).toV0();
      assert.deepStrictEqual(cid$1.version, 0);
    });
    it('should not convert v1 to v0 if not dag-pb codec', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(1, 113, hash);
      assert.throws(() => cid$1.toV0(), 'Cannot convert a non dag-pb CID to CIDv0');
    });
    it('should not convert v1 to v0 if not sha2-256 multihash', async () => {
      const hash = await sha2.sha512.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.throws(() => cid$1.toV0(), 'Cannot convert non sha2-256 multihash CID to CIDv0');
    });
    it('should return assert.deepStrictEqual instance when converting v1 to v1', async () => {
      const hash = await sha2.sha512.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.deepStrictEqual(cid$1.toV1() === cid$1, true);
    });
    it('should return assert.deepStrictEqual instance when converting v0 to v0', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(0, 112, hash);
      assert.deepStrictEqual(cid$1.toV0() === cid$1, true);
    });
  });
  describe('caching', () => {
    it('should cache CID as buffer', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.ok(cid$1.bytes);
      assert.deepStrictEqual(cid$1.bytes, cid$1.bytes);
    });
    it('should cache string representation when it matches the multibaseName it was constructed with', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.deepStrictEqual(cid$1._baseCache.size, 0);
      assert.deepStrictEqual(cid$1.toString(base64.base64), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt');
      assert.deepStrictEqual(cid$1._baseCache.get(base64.base64.prefix), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt');
      assert.deepStrictEqual(cid$1._baseCache.has(base32.base32.prefix), false);
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu';
      assert.deepStrictEqual(cid$1.toString(), base32String);
      assert.deepStrictEqual(cid$1._baseCache.get(base32.base32.prefix), base32String);
      assert.deepStrictEqual(cid$1.toString(base64.base64), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt');
    });
    it('should cache string representation when constructed with one', () => {
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu';
      const cid$1 = cid.CID.parse(base32String);
      assert.deepStrictEqual(cid$1._baseCache.get(base32.base32.prefix), base32String);
    });
  });
  it('toJSON()', async () => {
    const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
    const cid$1 = cid.CID.create(1, 112, hash);
    const json = cid$1.toJSON();
    assert.deepStrictEqual({
      ...json,
      hash: null
    }, {
      code: 112,
      version: 1,
      hash: null
    });
    assert.ok(bytes.equals(json.hash, hash.bytes));
  });
  it('isCID', async () => {
    const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
    const cid$1 = cid.CID.create(1, 112, hash);
    assert.strictEqual(OLDCID__default["default"].isCID(cid$1), false);
  });
  it('asCID', async () => {
    const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
    class IncompatibleCID {
      constructor(version, code, multihash) {
        this.version = version;
        this.code = code;
        this.multihash = multihash;
        this.asCID = this;
      }
      get [Symbol.for('@ipld/js-cid/CID')]() {
        return true;
      }
    }
    const version = 1;
    const code = 112;
    const incompatibleCID = new IncompatibleCID(version, code, hash);
    assert.ok(cid.CID.isCID(incompatibleCID));
    assert.strictEqual(incompatibleCID.toString(), '[object Object]');
    assert.strictEqual(typeof incompatibleCID.toV0, 'undefined');
    const cid1 = cid.CID.asCID(incompatibleCID);
    assert.ok(cid1 instanceof cid.CID);
    assert.strictEqual(cid1.code, code);
    assert.strictEqual(cid1.version, version);
    assert.ok(bytes.equals(cid1.multihash.bytes, hash.bytes));
    const cid2 = cid.CID.asCID({
      version,
      code,
      hash
    });
    assert.strictEqual(cid2, null);
    const duckCID = {
      version,
      code,
      multihash: hash
    };
    duckCID.asCID = duckCID;
    const cid3 = cid.CID.asCID(duckCID);
    assert.ok(cid3 instanceof cid.CID);
    assert.strictEqual(cid3.code, code);
    assert.strictEqual(cid3.version, version);
    assert.ok(bytes.equals(cid3.multihash.bytes, hash.bytes));
    const cid4 = cid.CID.asCID(cid3);
    assert.strictEqual(cid3, cid4);
    const cid5 = cid.CID.asCID(new OLDCID__default["default"](1, 'raw', Uint8Array.from(hash.bytes)));
    assert.ok(cid5 instanceof cid.CID);
    assert.strictEqual(cid5.version, 1);
    assert.ok(bytes.equals(cid5.multihash.bytes, hash.bytes));
    assert.strictEqual(cid5.code, 85);
  });
  const digestsame = (x, y) => {
    assert.deepStrictEqual(x.hash, y.hash);
    assert.deepStrictEqual(x.bytes, y.bytes);
    if (x.multihash) {
      equalDigest(x.multihash, y.multihash);
    }
    const empty = {
      hash: null,
      bytes: null,
      digest: null,
      multihash: null
    };
    assert.deepStrictEqual({
      ...x,
      ...empty
    }, {
      ...y,
      ...empty
    });
  };
  const equalDigest = (x, y) => {
    assert.deepStrictEqual(x.digest, y.digest);
    assert.deepStrictEqual(x.code, y.code);
    assert.deepStrictEqual(x.digest, y.digest);
  };
  describe('CID.parse', async () => {
    it('parse 32 encoded CIDv1', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      const parsed = cid.CID.parse(cid$1.toString());
      digestsame(cid$1, parsed);
    });
    it('parse base58btc encoded CIDv1', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      const parsed = cid.CID.parse(cid$1.toString(base58.base58btc));
      digestsame(cid$1, parsed);
    });
    it('parse base58btc encoded CIDv0', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(0, 112, hash);
      const parsed = cid.CID.parse(cid$1.toString());
      digestsame(cid$1, parsed);
    });
    it('fails to parse base64 encoded CIDv1', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      const msg = 'To parse non base32 or base58btc encoded CID multibase decoder must be provided';
      assert.throws(() => cid.CID.parse(cid$1.toString(base64.base64)), msg);
    });
    it('parses base64 encoded CIDv1 if base64 is provided', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      const parsed = cid.CID.parse(cid$1.toString(base64.base64), base64.base64);
      digestsame(cid$1, parsed);
    });
  });
  it('inspect bytes', () => {
    const byts = bytes.fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const inspected = cid.CID.inspectBytes(byts.subarray(0, 10));
    assert.deepStrictEqual({
      version: 1,
      codec: 113,
      multihashCode: 18,
      multihashSize: 34,
      digestSize: 32,
      size: 36
    }, inspected);
    describe('decodeFirst', () => {
      it('no remainder', () => {
        const byts = bytes.fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        const [cid$1, remainder] = cid.CID.decodeFirst(byts);
        assert.deepStrictEqual(cid$1.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu');
        assert.deepStrictEqual(remainder.byteLength, 0);
      });
      it('remainder', () => {
        const byts = bytes.fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad0102030405');
        const [cid$1, remainder] = cid.CID.decodeFirst(byts);
        assert.deepStrictEqual(cid$1.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu');
        assert.deepStrictEqual(bytes.toHex(remainder), '0102030405');
      });
    });
  });
  it('new CID from old CID', async () => {
    const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
    const cid$1 = cid.CID.asCID(new OLDCID__default["default"](1, 'raw', Uint8Array.from(hash.bytes)));
    assert.deepStrictEqual(cid$1.version, 1);
    equalDigest(cid$1.multihash, hash);
    assert.deepStrictEqual(cid$1.code, 85);
  });
  it('util.inspect', async () => {
    const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
    const cid$1 = cid.CID.create(1, 112, hash);
    assert.deepStrictEqual(typeof cid$1[Symbol.for('nodejs.util.inspect.custom')], 'function');
    assert.deepStrictEqual(cid$1[Symbol.for('nodejs.util.inspect.custom')](), 'CID(bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu)');
  });
  describe('deprecations', async () => {
    it('codec', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.throws(() => cid$1.codec, '"codec" property is deprecated, use integer "code" property instead');
      assert.throws(() => cid.CID.create(1, 'dag-pb', hash), 'String codecs are no longer supported');
    });
    it('multibaseName', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.throws(() => cid$1.multibaseName, '"multibaseName" property is deprecated');
    });
    it('prefix', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.throws(() => cid$1.prefix, '"prefix" property is deprecated');
    });
    it('toBaseEncodedString()', async () => {
      const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
      const cid$1 = cid.CID.create(1, 112, hash);
      assert.throws(() => cid$1.toBaseEncodedString(), 'Deprecated, use .toString()');
    });
  });
  it('invalid CID version', async () => {
    const encoded = varint.encodeTo(2, new Uint8Array(32));
    assert.throws(() => cid.CID.decode(encoded), 'Invalid CID version 2');
  });
  it('buffer', async () => {
    const hash = await sha2.sha256.digest(textEncoder.encode('abc'));
    const cid$1 = cid.CID.create(1, 112, hash);
    assert.throws(() => cid$1.buffer, 'Deprecated .buffer property, use .bytes to get Uint8Array instead');
  });
});
