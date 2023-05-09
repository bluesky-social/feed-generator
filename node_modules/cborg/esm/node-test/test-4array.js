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
    data: '80',
    expected: [],
    type: 'array empty'
  },
  {
    data: '8102',
    expected: [2],
    type: 'array 1 compact uint'
  },
  {
    data: '8118ff',
    expected: [255],
    type: 'array 1 uint8'
  },
  {
    data: '811901f4',
    expected: [500],
    type: 'array 1 uint16'
  },
  {
    data: '811a00010000',
    expected: [65536],
    type: 'array 1 uint32'
  },
  {
    data: '811b00000000000000ff',
    expected: [255],
    type: 'array 1 uint64',
    strict: false
  },
  {
    data: '811b0016db6db6db6db7',
    expected: [Number.MAX_SAFE_INTEGER / 1.4],
    type: 'array 1 uint64'
  },
  {
    data: '811b001fffffffffffff',
    expected: [Number.MAX_SAFE_INTEGER],
    type: 'array 1 uint64'
  },
  {
    data: '8403040506',
    expected: [
      3,
      4,
      5,
      6
    ],
    type: 'array 4 ints'
  },
  {
    data: '8c1b0016db6db6db6db71a000100001901f40200202238ff3aa5f702b33b0016db6db6db6db74261316fc48c6175657320c39f76c49b746521',
    expected: [
      Number.MAX_SAFE_INTEGER / 1.4,
      65536,
      500,
      2,
      0,
      -1,
      -3,
      -256,
      -2784428724,
      Number.MIN_SAFE_INTEGER / 1.4 - 1,
      new TextEncoder().encode('a1'),
      'Čaues ßvěte!'
    ],
    type: 'array mixed terminals',
    label: '[]'
  },
  {
    data: '8265617272617982626f66820582666e657374656482666172726179736121',
    expected: [
      'array',
      [
        'of',
        [
          5,
          [
            'nested',
            [
              'arrays',
              '!'
            ]
          ]
        ]
      ]
    ],
    type: 'array nested'
  },
  {
    data: '980403040506',
    expected: [
      3,
      4,
      5,
      6
    ],
    type: 'array 4 ints, length8',
    strict: false
  },
  {
    data: '99000403040506',
    expected: [
      3,
      4,
      5,
      6
    ],
    type: 'array 4 ints, length16',
    strict: false
  },
  {
    data: '9a0000000403040506',
    expected: [
      3,
      4,
      5,
      6
    ],
    type: 'array 4 ints, length32',
    strict: false
  },
  {
    data: '9b000000000000000403040506',
    expected: [
      3,
      4,
      5,
      6
    ],
    type: 'array 4 ints, length64',
    strict: false
  }
];
describe('array', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = fromHex(fixture.data);
      it(`should decode ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        assert.deepStrictEqual(decode(data), fixture.expected, `decode ${ fixture.type }`);
        if (fixture.strict === false) {
          assert.throws(() => decode(data, { strict: true }), Error, 'CBOR decode error: integer encoded in more bytes than necessary (strict decode)');
        } else {
          assert.deepStrictEqual(decode(data, { strict: true }), fixture.expected, `decode ${ fixture.type }`);
        }
      });
      it('should fail to decode very large length', () => {
        assert.throws(() => decode(fromHex('9ba5f702b3a5f7020403040506')), /CBOR decode error: 64-bit integer array lengths not supported/);
      });
    }
  });
  describe('encode', () => {
    for (const fixture of fixtures) {
      it(`should encode ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
        if (fixture.unsafe) {
          assert.throws(encode.bind(null, fixture.expected), Error, /^CBOR encode error: number too large to encode \(\d+\)$/);
        } else if (fixture.strict === false) {
          assert.notDeepEqual(toHex(encode(fixture.expected)), fixture.data, `encode ${ fixture.type } !strict`);
        } else {
          assert.strictEqual(toHex(encode(fixture.expected)), fixture.data, `encode ${ fixture.type }`);
        }
      });
    }
  });
  describe('roundtrip', () => {
    for (const fixture of fixtures) {
      if (!fixture.unsafe && fixture.strict !== false) {
        it(`should roundtrip ${ fixture.type }=${ fixture.label || fixture.expected }`, () => {
          assert.deepStrictEqual(decode(encode(fixture.expected)), fixture.expected, `roundtrip ${ fixture.type }`);
        });
      }
    }
  });
  describe('specials', () => {
    it('can decode indefinite length items', () => {
      assert.deepStrictEqual(decode(fromHex('9f616f6174ff')), [
        'o',
        't'
      ]);
    });
    it('can switch off indefinite length support', () => {
      assert.throws(() => decode(fromHex('9f616f6174ff'), { allowIndefinite: false }), /indefinite/);
    });
  });
});