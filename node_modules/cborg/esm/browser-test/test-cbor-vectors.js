import chai from 'chai';
import {
  decode,
  encode
} from '../cborg.js';
import * as taglib from '../taglib.js';
import {
  fromHex,
  toHex
} from '../lib/byte-utils.js';
import { fixtures } from './appendix_a.js';
const {assert} = chai;
const tags = [];
const typeEncoders = {};
tags[0] = function (obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 1');
  }
  return `0("${ new Date(obj).toISOString().replace(/\.000Z$/, 'Z') }")`;
};
tags[1] = function (obj) {
  if (typeof obj !== 'number') {
    throw new Error('expected number for tag 1');
  }
  return `1(${ obj })`;
};
tags[2] = taglib.bigIntDecoder;
typeEncoders.bigint = taglib.bigIntEncoder;
tags[3] = taglib.bigNegIntDecoder;
tags[23] = function (obj) {
  if (!(obj instanceof Uint8Array)) {
    throw new Error('expected byte array for tag 23');
  }
  return `23(h'${ toHex(obj) }')`;
};
tags[24] = function (obj) {
  return tags[23](obj).replace(/^23/, '24');
};
tags[32] = function (obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 32');
  }
  ;
  (() => new URL(obj))();
  return `32("${ obj }")`;
};
describe('cbor/test-vectors', () => {
  let i = 0;
  for (const fixture of fixtures) {
    const u8a = fromHex(fixture.hex);
    let expected = fixture.decoded !== undefined ? fixture.decoded : fixture.diagnostic;
    if (typeof expected === 'string' && expected.startsWith('h\'')) {
      expected = fromHex(expected.replace(/(^h)'|('$)/g, ''));
    }
    it(`test vector #${ i }: ${ inspect(expected).replace(/\n\s*/g, '') }`, () => {
      if (fixture.error) {
        assert.throws(() => decode(u8a, { tags }), fixture.error);
      } else {
        if (fixture.noTagDecodeError) {
          assert.throws(() => decode(u8a), fixture.noTagDecodeError);
        }
        let actual = decode(u8a, { tags });
        if (typeof actual === 'bigint') {
          actual = inspect(actual);
        }
        if (typeof expected === 'bigint') {
          expected = inspect(expected);
        }
        assert.deepEqual(actual, expected);
        if (fixture.roundtrip) {
          if (fixture.noTagEncodeError) {
            assert.throws(() => encode(decode(u8a, { tags })), fixture.noTagEncodeError);
          }
          const reencoded = encode(decode(u8a, { tags }), { typeEncoders });
          assert.equal(toHex(reencoded), fixture.hex);
        }
      }
    });
    i++;
  }
  it.skip('encode w/ tags', () => {
  });
});
function inspect(o) {
  if (typeof o === 'string') {
    return `'${ o }'`;
  }
  if (o instanceof Uint8Array) {
    return `Uint8Array<${ o.join(',') }>`;
  }
  if (o == null || typeof o !== 'object') {
    return String(o);
  }
  return JSON.stringify(o);
}