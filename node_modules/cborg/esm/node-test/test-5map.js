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
    data: 'a0',
    expected: {},
    type: 'map empty'
  },
  {
    data: 'a0',
    expected: new Map(),
    type: 'map empty (useMaps)',
    useMaps: true
  },
  {
    data: 'a1616101',
    expected: { a: 1 },
    type: 'map 1 pair'
  },
  {
    data: 'a161316161',
    expected: { 1: 'a' },
    type: 'map 1 pair (rev)'
  },
  {
    data: 'a1016161',
    expected: toMap([[
        1,
        'a'
      ]]),
    type: 'map 1 pair (int key as Map w/ useMaps)',
    useMaps: true
  },
  {
    data: 'a243010203633132334302030463323334',
    expected: toMap([
      [
        Uint8Array.from([
          1,
          2,
          3
        ]),
        '123'
      ],
      [
        Uint8Array.from([
          2,
          3,
          4
        ]),
        '234'
      ]
    ]),
    type: 'map 2 pair (bytes keys Map w/ useMaps)',
    useMaps: true
  },
  {
    data: 'a1666f626a656374a16477697468a26134666e6573746564676f626a65637473a161216121',
    expected: {
      object: {
        with: {
          4: 'nested',
          objects: { '!': '!' }
        }
      }
    },
    type: 'map nested'
  },
  {
    data: 'a1666f626a656374a16477697468a204666e6573746564676f626a65637473a161216121',
    expected: toMap([[
        'object',
        toMap([[
            'with',
            toMap([
              [
                4,
                'nested'
              ],
              [
                'objects',
                toMap([[
                    '!',
                    '!'
                  ]])
              ]
            ])
          ]])
      ]]),
    type: 'map nested w/ useMaps',
    useMaps: true
  },
  {
    data: 'ae636f6e651b0016db6db6db6db763736978206374656e3b0016db6db6db6db76374776f1a0001000064666976650064666f757202646e696e653aa5f702b365656967687438ff65736576656e226574687265651901f466656c6576656e426131667477656c76656fc48c6175657320c39f76c49b74652168666f75727465656ea4616664666f7572616f016174026274680368746869727465656e840203046466697665',
    encode: {
      one: Number.MAX_SAFE_INTEGER / 1.4,
      two: 65536,
      three: 500,
      four: 2,
      five: 0,
      six: -1,
      seven: -3,
      eight: -256,
      nine: -2784428724,
      ten: Number.MIN_SAFE_INTEGER / 1.4 - 1,
      eleven: new TextEncoder().encode('a1'),
      twelve: 'Čaues ßvěte!',
      thirteen: [
        2,
        3,
        4,
        'five'
      ],
      fourteen: {
        o: 1,
        t: 2,
        th: 3,
        f: 'four'
      }
    },
    expected: {
      one: Number.MAX_SAFE_INTEGER / 1.4,
      six: -1,
      ten: Number.MIN_SAFE_INTEGER / 1.4 - 1,
      two: 65536,
      five: 0,
      four: 2,
      nine: -2784428724,
      eight: -256,
      seven: -3,
      three: 500,
      eleven: new TextEncoder().encode('a1'),
      twelve: 'Čaues ßvěte!',
      fourteen: {
        f: 'four',
        o: 1,
        t: 2,
        th: 3
      },
      thirteen: [
        2,
        3,
        4,
        'five'
      ]
    },
    type: 'map with complex entries',
    label: '{}'
  },
  {
    data: 'ad01636f6e65026374776f1901f46c666976652068756e647265641902586b7369782068756e647265641a00010000636269671b0016db6db6db6db76662696767657220696d696e7573206f6e6521696d696e75732074776f38ff781f6d696e75732074776f2068756e6472656420616e64206669667479207369783901f4781a6d696e757820666976652068756e6472656420616e64206f6e653901f5781a6d696e757820666976652068756e6472656420616e642074776f3aa5f702b367626967206e65673b0016db6db6db6db76a626967676572206e6567',
    encode: toMap([
      [
        2,
        'two'
      ],
      [
        1,
        'one'
      ],
      [
        -2,
        'minus two'
      ],
      [
        -1,
        'minus one'
      ],
      [
        600,
        'six hundred'
      ],
      [
        500,
        'five hundred'
      ],
      [
        -256,
        'minus two hundred and fifty six'
      ],
      [
        -502,
        'minux five hundred and two'
      ],
      [
        -501,
        'minux five hundred and one'
      ],
      [
        65536,
        'big'
      ],
      [
        -2784428724,
        'big neg'
      ],
      [
        6433713753386423,
        'bigger'
      ],
      [
        -6433713753386424,
        'bigger neg'
      ]
    ]),
    expected: toMap([
      [
        1,
        'one'
      ],
      [
        2,
        'two'
      ],
      [
        500,
        'five hundred'
      ],
      [
        600,
        'six hundred'
      ],
      [
        65536,
        'big'
      ],
      [
        6433713753386423,
        'bigger'
      ],
      [
        -1,
        'minus one'
      ],
      [
        -2,
        'minus two'
      ],
      [
        -256,
        'minus two hundred and fifty six'
      ],
      [
        -501,
        'minux five hundred and one'
      ],
      [
        -502,
        'minux five hundred and two'
      ],
      [
        -2784428724,
        'big neg'
      ],
      [
        -6433713753386424,
        'bigger neg'
      ]
    ]),
    type: 'map with ints and negints',
    useMaps: true
  },
  {
    data: 'a44104636f6e65430102026374776f430102036574687265654301020464666f7572',
    encode: toMap([
      [
        Uint8Array.from([
          1,
          2,
          3
        ]),
        'three'
      ],
      [
        Uint8Array.from([4]),
        'one'
      ],
      [
        Uint8Array.from([
          1,
          2,
          4
        ]),
        'four'
      ],
      [
        Uint8Array.from([
          1,
          2,
          2
        ]),
        'two'
      ]
    ]),
    expected: toMap([
      [
        Uint8Array.from([4]),
        'one'
      ],
      [
        Uint8Array.from([
          1,
          2,
          2
        ]),
        'two'
      ],
      [
        Uint8Array.from([
          1,
          2,
          3
        ]),
        'three'
      ],
      [
        Uint8Array.from([
          1,
          2,
          4
        ]),
        'four'
      ]
    ]),
    type: 'map with bytes keys',
    useMaps: true
  },
  {
    data: 'b801616101',
    expected: { a: 1 },
    type: 'map 1 pair, length8',
    strict: false
  },
  {
    data: 'b90001616101',
    expected: { a: 1 },
    type: 'map 1 pair, length16',
    strict: false
  },
  {
    data: 'ba00000001616101',
    expected: { a: 1 },
    type: 'map 1 pair, length32',
    strict: false
  },
  {
    data: 'bb0000000000000001616101',
    expected: { a: 1 },
    type: 'map 1 pair, length64',
    strict: false
  }
];
function toMap(arr) {
  const m = new Map();
  for (const [key, value] of arr) {
    m.set(key, value);
  }
  return m;
}
function entries(map) {
  function nest(a) {
    for (const e of a) {
      e[0] = entries(e[0]);
      e[1] = entries(e[1]);
    }
    return a;
  }
  if (Object.getPrototypeOf(map) === Map.prototype) {
    return nest([...map.entries()]);
  }
  if (typeof map === 'object') {
    return nest([...Object.entries(map)]);
  }
  return map;
}
describe('map', () => {
  describe('decode', () => {
    for (const fixture of fixtures) {
      const data = fromHex(fixture.data);
      it(`should decode ${ fixture.type }=${ fixture.label || JSON.stringify(fixture.expected) }`, () => {
        let options = fixture.useMaps ? { useMaps: true } : undefined;
        const decoded = decode(data, options);
        if (fixture.useMaps) {
          assert.strictEqual(Object.getPrototypeOf(decoded), Map.prototype, 'is Map');
        } else {
          assert.isObject(decoded, 'is object');
        }
        assert.deepStrictEqual(entries(decoded), entries(fixture.expected), `decode ${ fixture.type }`);
        options = Object.assign({ strict: true }, options);
        if (fixture.strict === false) {
          assert.throws(() => decode(data, options), Error, 'CBOR decode error: integer encoded in more bytes than necessary (strict decode)');
        } else {
          assert.deepStrictEqual(entries(decode(data, options)), entries(fixture.expected), `decode ${ fixture.type }`);
        }
      });
      it('should fail to decode very large length', () => {
        assert.throws(() => decode(fromHex('bba5f702b3a5f70201616101')), /CBOR decode error: 64-bit integer map lengths not supported/);
      });
    }
    it('errors', () => {
      assert.throws(() => decode(fromHex('a1016161')), /non-string keys not supported \(got number\)/);
    });
  });
  describe('encode', () => {
    for (const fixture of fixtures) {
      it(`should encode ${ fixture.type }=${ fixture.label || JSON.stringify(fixture.expected) }`, () => {
        const toEncode = fixture.encode || fixture.expected;
        if (fixture.unsafe) {
          assert.throws(encode.bind(null, toEncode), Error, /^CBOR encode error: number too large to encode \(\d+\)$/);
        } else if (fixture.strict === false || fixture.roundtrip === false) {
          assert.notDeepEqual(toHex(encode(toEncode)), fixture.data, `encode ${ fixture.type } !strict`);
        } else {
          assert.strictEqual(toHex(encode(toEncode)), fixture.data, `encode ${ fixture.type }`);
        }
      });
    }
  });
  describe('roundtrip', () => {
    for (const fixture of fixtures) {
      if (!fixture.unsafe && fixture.strict !== false && fixture.roundtrip !== false) {
        it(`should roundtrip ${ fixture.type }=${ fixture.label || JSON.stringify(fixture.expected) }`, () => {
          const toEncode = fixture.encode || fixture.expected;
          const options = fixture.useMaps ? { useMaps: true } : undefined;
          const rt = decode(encode(toEncode), options);
          if (fixture.useMaps) {
            assert.strictEqual(Object.getPrototypeOf(rt), Map.prototype, 'is Map');
          } else {
            assert.isObject(rt, 'is object');
          }
          assert.deepStrictEqual(entries(rt), entries(fixture.expected), `roundtrip ${ fixture.type }`);
        });
      }
    }
  });
  describe('specials', () => {
    it('can decode indefinite length items', () => {
      assert.deepStrictEqual(decode(fromHex('bf616f01617402ff')), {
        o: 1,
        t: 2
      });
    });
    it('can switch off indefinite length support', () => {
      assert.throws(() => decode(fromHex('bf616f01617402ff'), { allowIndefinite: false }), /indefinite/);
    });
  });
  describe('sorting', () => {
    it('sorts int map keys', () => {
      assert.strictEqual(toHex(encode(new Map([
        [
          1,
          1
        ],
        [
          2,
          2
        ]
      ]))), 'a201010202');
      assert.strictEqual(toHex(encode(new Map([
        [
          2,
          1
        ],
        [
          1,
          2
        ]
      ]))), 'a201020201');
    });
    it('sorts negint map keys', () => {
      assert.strictEqual(toHex(encode(new Map([
        [
          -1,
          1
        ],
        [
          -2,
          2
        ]
      ]))), 'a220012102');
      assert.strictEqual(toHex(encode(new Map([
        [
          -2,
          1
        ],
        [
          -1,
          2
        ]
      ]))), 'a220022101');
    });
    it('sorts bytes map keys', () => {
      assert.strictEqual(toHex(encode(new Map([
        [
          Uint8Array.from([
            1,
            2
          ]),
          1
        ],
        [
          Uint8Array.from([
            2,
            1
          ]),
          2
        ]
      ]))), 'a24201020142020102');
      assert.strictEqual(toHex(encode(new Map([
        [
          Uint8Array.from([
            2,
            1
          ]),
          1
        ],
        [
          Uint8Array.from([
            1,
            2
          ]),
          2
        ]
      ]))), 'a24201020242020101');
      assert.strictEqual(toHex(encode(new Map([
        [
          Uint8Array.from([
            1,
            2
          ]),
          1
        ],
        [
          Uint8Array.from([
            2,
            1
          ]),
          2
        ],
        [
          Uint8Array.from([200]),
          3
        ]
      ]))), 'a341c8034201020142020102');
    });
    it('sorts bytes map keys', () => {
      assert.strictEqual(toHex(encode(new Map([
        [
          Uint8Array.from([
            1,
            2
          ]),
          1
        ],
        [
          Uint8Array.from([
            2,
            1
          ]),
          2
        ]
      ]))), 'a24201020142020102');
      assert.strictEqual(toHex(encode(new Map([
        [
          Uint8Array.from([
            2,
            1
          ]),
          1
        ],
        [
          Uint8Array.from([
            1,
            2
          ]),
          2
        ]
      ]))), 'a24201020242020101');
      assert.strictEqual(toHex(encode(new Map([
        [
          Uint8Array.from([
            1,
            2
          ]),
          1
        ],
        [
          Uint8Array.from([
            2,
            1
          ]),
          2
        ],
        [
          Uint8Array.from([200]),
          3
        ]
      ]))), 'a341c8034201020142020102');
    });
    it('sorts array map keys (length only)', () => {
      assert.strictEqual(toHex(encode(new Map([
        [
          [1],
          1
        ],
        [
          [
            1,
            1
          ],
          2
        ]
      ]))), 'a281010182010102');
      assert.strictEqual(toHex(encode(new Map([
        [
          [
            1,
            1
          ],
          1
        ],
        [
          [1],
          2
        ]
      ]))), 'a281010282010101');
    });
    it('sorts map map keys (length only)', () => {
      assert.strictEqual(toHex(encode(new Map([
        [
          { a: 1 },
          1
        ],
        [
          {
            a: 1,
            b: 1
          },
          2
        ]
      ]))), 'a2a161610101a261610161620102');
      assert.strictEqual(toHex(encode(new Map([
        [
          {
            a: 1,
            b: 1
          },
          1
        ],
        [
          { a: 1 },
          2
        ]
      ]))), 'a2a161610102a261610161620101');
    });
  });
});