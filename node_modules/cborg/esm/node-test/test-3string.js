import chai from 'chai';
import {
  decode,
  encode
} from '../cborg.js';
import {
  fromHex,
  toHex
} from '../lib/byte-utils.js';
const {assert} = chai;
const fixtures = [
  {
    data: '60',
    expected: '',
    type: 'string'
  },
  {
    data: '6161',
    expected: 'a',
    type: 'string'
  },
  {
    data: '780161',
    expected: 'a',
    type: 'string',
    strict: false
  },
  {
    data: '6c48656c6c6f20776f726c6421',
    expected: 'Hello world!',
    type: 'string'
  },
  {
    data: '6fc48c6175657320c39f76c49b746521',
    expected: 'Čaues ßvěte!',
    type: 'string'
  },
  {
    data: '78964c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742e20446f6e6563206d692074656c6c75732c20696163756c6973206e656320766573746962756c756d20717569732c206665726d656e74756d206e6f6e2066656c69732e204d616563656e6173207574206a7573746f20706f73756572652e',
    expected: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mi tellus, iaculis nec vestibulum quis, fermentum non felis. Maecenas ut justo posuere.',
    type: 'string',
    label: 'long string, 8-bit length'
  },
  {
    data: '7900964c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742e20446f6e6563206d692074656c6c75732c20696163756c6973206e656320766573746962756c756d20717569732c206665726d656e74756d206e6f6e2066656c69732e204d616563656e6173207574206a7573746f20706f73756572652e',
    expected: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mi tellus, iaculis nec vestibulum quis, fermentum non felis. Maecenas ut justo posuere.',
    type: 'string',
    label: 'long string, 16-bit length',
    strict: false
  },
  {
    data: '7a000000964c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742e20446f6e6563206d692074656c6c75732c20696163756c6973206e656320766573746962756c756d20717569732c206665726d656e74756d206e6f6e2066656c69732e204d616563656e6173207574206a7573746f20706f73756572652e',
    expected: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mi tellus, iaculis nec vestibulum quis, fermentum non felis. Maecenas ut justo posuere.',
    type: 'string',
    label: 'long string, 32-bit length',
    strict: false
  },
  {
    data: '7b00000000000000964c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742e20446f6e6563206d692074656c6c75732c20696163756c6973206e656320766573746962756c756d20717569732c206665726d656e74756d206e6f6e2066656c69732e204d616563656e6173207574206a7573746f20706f73756572652e',
    expected: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mi tellus, iaculis nec vestibulum quis, fermentum non felis. Maecenas ut justo posuere.',
    type: 'string',
    label: 'long string, 64-bit length',
    strict: false
  }
];
(() => {
  function rnd(length) {
    const sa = [];
    let l = 0;
    while (l < length) {
      const ascii = length - l < 3;
      const base = ascii ? 32 : 126976;
      const max = ascii ? 126 : 130816;
      const cc = Math.floor(Math.random() * (max - base)) + base;
      const s = String.fromCharCode(cc);
      l += new TextEncoder().encode(s).length;
      sa.push(s);
    }
    return sa.join('');
  }
  const expected16 = rnd(256);
  fixtures.push({
    data: new Uint8Array([
      ...fromHex('790100'),
      ...new TextEncoder().encode(expected16)
    ]),
    expected: expected16,
    type: 'string',
    label: 'long string, 16-bit length strict-compat'
  });
  const expected32 = rnd(65536);
  fixtures.push({
    data: new Uint8Array([
      ...fromHex('7a00010000'),
      ...new TextEncoder().encode(expected32)
    ]),
    expected: expected32,
    type: 'string',
    label: 'long string, 32-bit length strict-compat'
  });
})();
describe('string', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = fromHex(fixture.data);
      it(`should decode ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        let actual = decode(data);
        assert.strictEqual(actual, fixture.expected, `decode ${ fixture.type }`);
        if (fixture.strict === false) {
          assert.throws(() => decode(data, { strict: true }), Error, 'CBOR decode error: integer encoded in more bytes than necessary (strict decode)');
        } else {
          actual = decode(data, { strict: true });
          assert.strictEqual(actual, fixture.expected, `decode ${ fixture.type } strict`);
        }
      });
      it('should fail to decode very large length', () => {
        assert.throws(() => decode(fromHex('7ba5f702b3a5f702b34c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742e20446f6e6563206d692074656c6c75732c20696163756c6973206e656320766573746962756c756d20717569732c206665726d656e74756d206e6f6e2066656c69732e204d616563656e6173207574206a7573746f20706f73756572652e')), /CBOR decode error: 64-bit integer string lengths not supported/);
      });
    }
  });
  describe('encode', () => {
    for (const fixture of fixtures) {
      if (fixture.data.length >= 100000000) {
        it.skip(`(TODO) skipping encode of very large string ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        });
        continue;
      }
      const data = fixture.expected;
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
});