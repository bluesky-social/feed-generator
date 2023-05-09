import chai from 'chai';
import {
  decode,
  encode
} from '../cborg.js';
import {
  useBuffer,
  fromHex,
  toHex
} from '../lib/byte-utils.js';
const {assert} = chai;
const fixtures = [
  {
    data: '40',
    expected: '',
    type: 'bytes'
  },
  {
    data: '41a1',
    expected: 'a1',
    type: 'bytes'
  },
  {
    data: '5801a1',
    expected: 'a1',
    type: 'bytes',
    strict: false
  },
  {
    data: '58ff000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    expected: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    type: 'bytes',
    label: 'long bytes, 8-bit length'
  },
  {
    data: '5900ff000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    expected: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    type: 'bytes',
    label: 'long bytes, 16-bit length',
    strict: false
  },
  {
    data: '5a000000ff000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    expected: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    type: 'bytes',
    label: 'long bytes, 32-bit length',
    strict: false
  },
  {
    data: '5b00000000000000ff000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    expected: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe',
    type: 'bytes',
    label: 'long bytes, 64-bit length',
    strict: false
  }
];
(() => {
  function rnd(length) {
    return new Uint8Array(Array.from({ length }, () => Math.floor(Math.random() * 255)));
  }
  const expected16 = rnd(256);
  fixtures.push({
    data: new Uint8Array([
      ...fromHex('590100'),
      ...expected16
    ]),
    expected: expected16,
    type: 'bytes',
    label: 'long bytes, 16-bit length strict-compat'
  });
  const expected32 = rnd(65536);
  fixtures.push({
    data: new Uint8Array([
      ...fromHex('5a00010000'),
      ...expected32
    ]),
    expected: expected32,
    type: 'bytes',
    label: 'long bytes, 32-bit length strict-compat'
  });
})();
describe('bytes', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = fromHex(fixture.data);
      it(`should decode ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        let actual = decode(data);
        assert.strictEqual(toHex(actual), toHex(fromHex(fixture.expected)), `decode ${ fixture.type }`);
        if (fixture.strict === false) {
          assert.throws(() => decode(data, { strict: true }), Error, 'CBOR decode error: integer encoded in more bytes than necessary (strict decode)');
        } else {
          actual = decode(data, { strict: true });
          assert.strictEqual(toHex(actual), toHex(fromHex(fixture.expected)), `decode ${ fixture.type } strict`);
        }
      });
      it('should fail to decode very large length', () => {
        assert.throws(() => decode(fromHex('5ba5f702b3a5f702b3000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfe')), /CBOR decode error: 64-bit integer bytes lengths not supported/);
      });
    }
  });
  describe('encode', () => {
    for (const fixture of fixtures) {
      if (fixture.data.length >= 100000000) {
        it.skip(`(TODO) skipping encode of very large bytes ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        });
        continue;
      }
      const data = fromHex(fixture.expected);
      const expectedHex = toHex(fixture.data);
      it(`should encode ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        if (fixture.unsafe) {
          assert.throws(() => encode(data), Error, /^CBOR encode error: number too large to encode \(-\d+\)$/);
        } else if (fixture.strict === false) {
          assert.notStrictEqual(toHex(encode(data)), expectedHex, `encode ${ fixture.type } !strict`);
        } else {
          assert.strictEqual(toHex(encode(data)), expectedHex, `encode ${ fixture.type }`);
        }
      });
    }
  });
  describe('typedarrays', () => {
    const cases = [
      {
        obj: Uint8Array.from([
          1,
          2,
          3
        ]),
        hex: '43010203'
      },
      {
        obj: Uint8ClampedArray.from([
          1,
          2,
          3
        ]),
        hex: '43010203'
      },
      {
        obj: Uint16Array.from([
          1,
          2,
          3
        ]),
        hex: '46010002000300'
      },
      {
        obj: Uint32Array.from([
          1,
          2,
          3
        ]),
        hex: '4c010000000200000003000000'
      },
      {
        obj: Int8Array.from([
          1,
          2,
          -3
        ]),
        hex: '430102fd'
      },
      {
        obj: Int16Array.from([
          1,
          2,
          -3
        ]),
        hex: '4601000200fdff'
      },
      {
        obj: Int32Array.from([
          1,
          2,
          -3
        ]),
        hex: '4c0100000002000000fdffffff'
      },
      {
        obj: Float32Array.from([
          1,
          2,
          -3
        ]),
        hex: '4c0000803f00000040000040c0'
      },
      {
        obj: Float64Array.from([
          1,
          2,
          -3
        ]),
        hex: '5818000000000000f03f000000000000004000000000000008c0'
      },
      {
        obj: BigUint64Array.from([
          BigInt(1),
          BigInt(2),
          BigInt(3)
        ]),
        hex: '5818010000000000000002000000000000000300000000000000'
      },
      {
        obj: BigInt64Array.from([
          BigInt(1),
          BigInt(2),
          BigInt(-3)
        ]),
        hex: '581801000000000000000200000000000000fdffffffffffffff'
      },
      {
        obj: new DataView(Uint8Array.from([
          1,
          2,
          3
        ]).buffer),
        hex: '43010203'
      },
      {
        obj: Uint8Array.from([
          1,
          2,
          3
        ]).buffer,
        hex: '43010203'
      }
    ];
    for (const testCase of cases) {
      it(testCase.obj.constructor.name, () => {
        assert.equal(toHex(encode(testCase.obj)), testCase.hex);
        const decoded = decode(fromHex(testCase.hex));
        assert.instanceOf(decoded, Uint8Array);
        assert.equal(toHex(decoded), toHex(testCase.obj));
      });
    }
  });
  if (useBuffer) {
    describe('buffer', () => {
      it('can encode Node.js Buffers', () => {
        const obj = global.Buffer.from([
          1,
          2,
          3
        ]);
        assert.equal(toHex(encode(obj)), '43010203');
        const decoded = decode(fromHex('43010203'));
        assert.instanceOf(decoded, Uint8Array);
        assert.equal(toHex(decoded), toHex(obj));
      });
    });
  }
});