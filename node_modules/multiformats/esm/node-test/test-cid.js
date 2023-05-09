import OLDCID from 'cids';
import {
  fromHex,
  toHex,
  equals
} from '../src/bytes.js';
import {
  varint,
  CID
} from '../src/index.js';
import { base58btc } from '../src/bases/base58.js';
import { base32 } from '../src/bases/base32.js';
import { base64 } from '../src/bases/base64.js';
import {
  sha256,
  sha512
} from '../src/hashes/sha2.js';
import invalidMultihash from './fixtures/invalid-multihash.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const {assert} = chai;
const textEncoder = new TextEncoder();
describe('CID', () => {
  describe('v0', () => {
    it('handles B58Str multihash', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
      const cid = CID.parse(mhStr);
      assert.deepStrictEqual(cid.version, 0);
      assert.deepStrictEqual(cid.code, 112);
      assert.deepStrictEqual(cid.multihash.bytes, base58btc.baseDecode(mhStr));
      assert.deepStrictEqual(cid.toString(), mhStr);
    });
    it('create by parts', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(0, 112, hash);
      assert.deepStrictEqual(cid.code, 112);
      assert.deepStrictEqual(cid.version, 0);
      assert.deepStrictEqual(cid.multihash, hash);
      assert.deepStrictEqual(cid.toString(), base58btc.baseEncode(hash.bytes));
    });
    it('create from multihash', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.decode(hash.bytes);
      assert.deepStrictEqual(cid.code, 112);
      assert.deepStrictEqual(cid.version, 0);
      assert.deepStrictEqual(cid.multihash.digest, hash.digest);
      assert.deepStrictEqual({
        ...cid.multihash,
        digest: null
      }, {
        ...hash,
        digest: null
      });
      cid.toString();
      assert.deepStrictEqual(cid.toString(), base58btc.baseEncode(hash.bytes));
    });
    it('throws on invalid BS58Str multihash ', async () => {
      const msg = 'Non-base58btc character';
      assert.throws(() => CID.parse('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zIII'), msg);
    });
    it('throws on trying to create a CIDv0 with a codec other than dag-pb', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const msg = 'Version 0 CID must use dag-pb (code: 112) block encoding';
      assert.throws(() => CID.create(0, 113, hash), msg);
    });
    it('throws on trying to base encode CIDv0 in other base than base58btc', async () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
      const cid = CID.parse(mhStr);
      const msg = 'Cannot string encode V0 in base32 encoding';
      assert.throws(() => cid.toString(base32), msg);
    });
    it('.bytes', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const codec = 112;
      const cid = CID.create(0, codec, hash);
      const bytes = cid.bytes;
      assert.ok(bytes);
      const str = toHex(bytes);
      assert.deepStrictEqual(str, '1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
    it('should construct from an old CID', () => {
      const cidStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
      const oldCid = CID.parse(cidStr);
      const newCid = CID.asCID(oldCid);
      assert.deepStrictEqual(newCid.toString(), cidStr);
    });
    it('inspect bytes', () => {
      const byts = fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      const inspected = CID.inspectBytes(byts.subarray(0, 10));
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
        const byts = fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        const [cid, remainder] = CID.decodeFirst(byts);
        assert.deepStrictEqual(cid.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY');
        assert.deepStrictEqual(remainder.byteLength, 0);
      });
      it('remainder', () => {
        const byts = fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad0102030405');
        const [cid, remainder] = CID.decodeFirst(byts);
        assert.deepStrictEqual(cid.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY');
        assert.deepStrictEqual(toHex(remainder), '0102030405');
      });
    });
  });
  describe('v1', () => {
    it('handles CID String (multibase encoded)', () => {
      const cidStr = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS';
      const cid = CID.parse(cidStr);
      assert.deepStrictEqual(cid.code, 112);
      assert.deepStrictEqual(cid.version, 1);
      assert.ok(cid.multihash);
      assert.deepStrictEqual(cid.toString(), base32.encode(cid.bytes));
    });
    it('handles CID (no multibase)', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u';
      const cidBuf = fromHex('017012207252523e6591fb8fe553d67ff55a86f84044b46a3e4176e10c58fa529a4aabd5');
      const cid = CID.decode(cidBuf);
      assert.deepStrictEqual(cid.code, 112);
      assert.deepStrictEqual(cid.version, 1);
      assert.deepStrictEqual(cid.toString(), cidStr);
    });
    it('create by parts', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 113, hash);
      assert.deepStrictEqual(cid.code, 113);
      assert.deepStrictEqual(cid.version, 1);
      equalDigest(cid.multihash, hash);
    });
    it('can roundtrip through cid.toString()', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid1 = CID.create(1, 113, hash);
      const cid2 = CID.parse(cid1.toString());
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
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const code = 113;
      const cid = CID.create(1, code, hash);
      const bytes = cid.bytes;
      assert.ok(bytes);
      const str = toHex(bytes);
      assert.deepStrictEqual(str, '01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
    it('should construct from an old CID without a multibaseName', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u';
      const oldCid = CID.parse(cidStr);
      const newCid = CID.asCID(oldCid);
      assert.deepStrictEqual(newCid.toString(), cidStr);
    });
  });
  describe('utilities', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
    const h2 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1o';
    const h3 = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS';
    it('.equals v0 to v0', () => {
      const cid1 = CID.parse(h1);
      assert.deepStrictEqual(cid1.equals(CID.parse(h1)), true);
      assert.deepStrictEqual(cid1.equals(CID.create(cid1.version, cid1.code, cid1.multihash)), true);
      const cid2 = CID.parse(h2);
      assert.deepStrictEqual(cid1.equals(CID.parse(h2)), false);
      assert.deepStrictEqual(cid1.equals(CID.create(cid2.version, cid2.code, cid2.multihash)), false);
    });
    it('.equals v0 to v1 and vice versa', () => {
      const cidV1 = CID.parse(h3);
      const cidV0 = cidV1.toV0();
      assert.deepStrictEqual(cidV0.equals(cidV1), false);
      assert.deepStrictEqual(cidV1.equals(cidV0), false);
      assert.deepStrictEqual(cidV1.multihash, cidV0.multihash);
    });
    it('.equals v1 to v1', () => {
      const cid1 = CID.parse(h3);
      assert.deepStrictEqual(cid1.equals(CID.parse(h3)), true);
      assert.deepStrictEqual(cid1.equals(CID.create(cid1.version, cid1.code, cid1.multihash)), true);
    });
    it('.isCid', () => {
      assert.ok(CID.isCID(CID.parse(h1)));
      assert.ok(!CID.isCID(false));
      assert.ok(!CID.isCID(textEncoder.encode('hello world')));
      assert.ok(CID.isCID(CID.parse(h1).toV0()));
      assert.ok(CID.isCID(CID.parse(h1).toV1()));
    });
    it('works with deepEquals', () => {
      const ch1 = CID.parse(h1);
      ch1._baseCache.set('herp', 'derp');
      assert.deepStrictEqual(ch1, CID.parse(h1));
      assert.notDeepEqual(ch1, CID.parse(h2));
    });
  });
  describe('throws on invalid inputs', () => {
    const parse = [
      'hello world',
      'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L'
    ];
    for (const i of parse) {
      const name = `CID.parse(${ JSON.stringify(i) })`;
      it(name, async () => assert.throws(() => CID.parse(i)));
    }
    const decode = [
      textEncoder.encode('hello world'),
      textEncoder.encode('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT')
    ];
    for (const i of decode) {
      const name = `CID.decode(textEncoder.encode(${ JSON.stringify(i.toString()) }))`;
      it(name, async () => assert.throws(() => CID.decode(i)));
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
      it(name, async () => assert.throws(() => CID.create(version, code, hash)));
    }
    it('invalid fixtures', async () => {
      for (const test of invalidMultihash) {
        const buff = fromHex(`0171${ test.hex }`);
        assert.throws(() => CID.decode(buff), new RegExp(test.message));
      }
    });
  });
  describe('idempotence', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n';
    const cid1 = CID.parse(h1);
    const cid2 = CID.asCID(cid1);
    it('constructor accept constructed instance', () => {
      assert.deepStrictEqual(cid1 === cid2, true);
    });
  });
  describe('conversion v0 <-> v1', () => {
    it('should convert v0 to v1', async () => {
      const hash = await sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(0, 112, hash).toV1();
      assert.deepStrictEqual(cid.version, 1);
    });
    it('should convert v1 to v0', async () => {
      const hash = await sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(1, 112, hash).toV0();
      assert.deepStrictEqual(cid.version, 0);
    });
    it('should not convert v1 to v0 if not dag-pb codec', async () => {
      const hash = await sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(1, 113, hash);
      assert.throws(() => cid.toV0(), 'Cannot convert a non dag-pb CID to CIDv0');
    });
    it('should not convert v1 to v0 if not sha2-256 multihash', async () => {
      const hash = await sha512.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(1, 112, hash);
      assert.throws(() => cid.toV0(), 'Cannot convert non sha2-256 multihash CID to CIDv0');
    });
    it('should return assert.deepStrictEqual instance when converting v1 to v1', async () => {
      const hash = await sha512.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(1, 112, hash);
      assert.deepStrictEqual(cid.toV1() === cid, true);
    });
    it('should return assert.deepStrictEqual instance when converting v0 to v0', async () => {
      const hash = await sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(0, 112, hash);
      assert.deepStrictEqual(cid.toV0() === cid, true);
    });
  });
  describe('caching', () => {
    it('should cache CID as buffer', async () => {
      const hash = await sha256.digest(textEncoder.encode(`TEST${ Date.now() }`));
      const cid = CID.create(1, 112, hash);
      assert.ok(cid.bytes);
      assert.deepStrictEqual(cid.bytes, cid.bytes);
    });
    it('should cache string representation when it matches the multibaseName it was constructed with', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      assert.deepStrictEqual(cid._baseCache.size, 0);
      assert.deepStrictEqual(cid.toString(base64), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt');
      assert.deepStrictEqual(cid._baseCache.get(base64.prefix), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt');
      assert.deepStrictEqual(cid._baseCache.has(base32.prefix), false);
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu';
      assert.deepStrictEqual(cid.toString(), base32String);
      assert.deepStrictEqual(cid._baseCache.get(base32.prefix), base32String);
      assert.deepStrictEqual(cid.toString(base64), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt');
    });
    it('should cache string representation when constructed with one', () => {
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu';
      const cid = CID.parse(base32String);
      assert.deepStrictEqual(cid._baseCache.get(base32.prefix), base32String);
    });
  });
  it('toJSON()', async () => {
    const hash = await sha256.digest(textEncoder.encode('abc'));
    const cid = CID.create(1, 112, hash);
    const json = cid.toJSON();
    assert.deepStrictEqual({
      ...json,
      hash: null
    }, {
      code: 112,
      version: 1,
      hash: null
    });
    assert.ok(equals(json.hash, hash.bytes));
  });
  it('isCID', async () => {
    const hash = await sha256.digest(textEncoder.encode('abc'));
    const cid = CID.create(1, 112, hash);
    assert.strictEqual(OLDCID.isCID(cid), false);
  });
  it('asCID', async () => {
    const hash = await sha256.digest(textEncoder.encode('abc'));
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
    assert.ok(CID.isCID(incompatibleCID));
    assert.strictEqual(incompatibleCID.toString(), '[object Object]');
    assert.strictEqual(typeof incompatibleCID.toV0, 'undefined');
    const cid1 = CID.asCID(incompatibleCID);
    assert.ok(cid1 instanceof CID);
    assert.strictEqual(cid1.code, code);
    assert.strictEqual(cid1.version, version);
    assert.ok(equals(cid1.multihash.bytes, hash.bytes));
    const cid2 = CID.asCID({
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
    const cid3 = CID.asCID(duckCID);
    assert.ok(cid3 instanceof CID);
    assert.strictEqual(cid3.code, code);
    assert.strictEqual(cid3.version, version);
    assert.ok(equals(cid3.multihash.bytes, hash.bytes));
    const cid4 = CID.asCID(cid3);
    assert.strictEqual(cid3, cid4);
    const cid5 = CID.asCID(new OLDCID(1, 'raw', Uint8Array.from(hash.bytes)));
    assert.ok(cid5 instanceof CID);
    assert.strictEqual(cid5.version, 1);
    assert.ok(equals(cid5.multihash.bytes, hash.bytes));
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
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      const parsed = CID.parse(cid.toString());
      digestsame(cid, parsed);
    });
    it('parse base58btc encoded CIDv1', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      const parsed = CID.parse(cid.toString(base58btc));
      digestsame(cid, parsed);
    });
    it('parse base58btc encoded CIDv0', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(0, 112, hash);
      const parsed = CID.parse(cid.toString());
      digestsame(cid, parsed);
    });
    it('fails to parse base64 encoded CIDv1', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      const msg = 'To parse non base32 or base58btc encoded CID multibase decoder must be provided';
      assert.throws(() => CID.parse(cid.toString(base64)), msg);
    });
    it('parses base64 encoded CIDv1 if base64 is provided', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      const parsed = CID.parse(cid.toString(base64), base64);
      digestsame(cid, parsed);
    });
  });
  it('inspect bytes', () => {
    const byts = fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const inspected = CID.inspectBytes(byts.subarray(0, 10));
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
        const byts = fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        const [cid, remainder] = CID.decodeFirst(byts);
        assert.deepStrictEqual(cid.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu');
        assert.deepStrictEqual(remainder.byteLength, 0);
      });
      it('remainder', () => {
        const byts = fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad0102030405');
        const [cid, remainder] = CID.decodeFirst(byts);
        assert.deepStrictEqual(cid.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu');
        assert.deepStrictEqual(toHex(remainder), '0102030405');
      });
    });
  });
  it('new CID from old CID', async () => {
    const hash = await sha256.digest(textEncoder.encode('abc'));
    const cid = CID.asCID(new OLDCID(1, 'raw', Uint8Array.from(hash.bytes)));
    assert.deepStrictEqual(cid.version, 1);
    equalDigest(cid.multihash, hash);
    assert.deepStrictEqual(cid.code, 85);
  });
  it('util.inspect', async () => {
    const hash = await sha256.digest(textEncoder.encode('abc'));
    const cid = CID.create(1, 112, hash);
    assert.deepStrictEqual(typeof cid[Symbol.for('nodejs.util.inspect.custom')], 'function');
    assert.deepStrictEqual(cid[Symbol.for('nodejs.util.inspect.custom')](), 'CID(bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu)');
  });
  describe('deprecations', async () => {
    it('codec', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      assert.throws(() => cid.codec, '"codec" property is deprecated, use integer "code" property instead');
      assert.throws(() => CID.create(1, 'dag-pb', hash), 'String codecs are no longer supported');
    });
    it('multibaseName', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      assert.throws(() => cid.multibaseName, '"multibaseName" property is deprecated');
    });
    it('prefix', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      assert.throws(() => cid.prefix, '"prefix" property is deprecated');
    });
    it('toBaseEncodedString()', async () => {
      const hash = await sha256.digest(textEncoder.encode('abc'));
      const cid = CID.create(1, 112, hash);
      assert.throws(() => cid.toBaseEncodedString(), 'Deprecated, use .toString()');
    });
  });
  it('invalid CID version', async () => {
    const encoded = varint.encodeTo(2, new Uint8Array(32));
    assert.throws(() => CID.decode(encoded), 'Invalid CID version 2');
  });
  it('buffer', async () => {
    const hash = await sha256.digest(textEncoder.encode('abc'));
    const cid = CID.create(1, 112, hash);
    assert.throws(() => cid.buffer, 'Deprecated .buffer property, use .bytes to get Uint8Array instead');
  });
});