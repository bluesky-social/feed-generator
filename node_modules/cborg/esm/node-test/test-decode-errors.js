import chai from 'chai';
import { decode } from '../cborg.js';
import { fromHex } from '../lib/byte-utils.js';
const {assert} = chai;
describe('decode errors', () => {
  it('not Uint8Array', () => {
    for (const arg of [
        true,
        false,
        null,
        undefined,
        'string',
        { obj: 'ect' },
        {},
        ['array'],
        [],
        [
          1,
          2,
          3
        ],
        0,
        100,
        1.1,
        -1,
        Symbol.for('nope')
      ]) {
      assert.throws(() => decode(arg), /CBOR decode error.*must be a Uint8Array/);
    }
  });
  it('no data', () => {
    assert.throws(() => decode(new Uint8Array('')), /CBOR decode error.*content/);
  });
  it('break only', () => {
    assert.throws(() => decode(new Uint8Array([255])), /CBOR decode error.*break/);
  });
  it('not enough map entries (value)', () => {
    assert.throws(() => decode(fromHex('a2616f016174')), /map.*not enough entries.*value/);
  });
  it('not enough map entries (key)', () => {
    assert.throws(() => decode(fromHex('a2616f01')), /map.*not enough entries.*key/);
  });
  it('break in lengthed map', () => {
    assert.throws(() => decode(fromHex('a2616f01ff740f')), /unexpected break to lengthed map/);
  });
  it('not enough array entries', () => {
    assert.throws(() => decode(fromHex('82616f')), /array.*not enough entries/);
  });
  it('break in lengthed array', () => {
    assert.throws(() => decode(fromHex('82ff')), /unexpected break to lengthed array/);
  });
  it('no such decoder', () => {
    assert.throws(() => decode(fromHex('82ff')), /unexpected break to lengthed array/);
  });
  it('too many terminals', () => {
    assert.throws(() => decode(fromHex('0101')), /too many terminals/);
  });
  it('rejectDuplicateMapKeys enabled on duplicate keys', () => {
    assert.deepStrictEqual(decode(fromHex('a3636261720363666f6f0163666f6f02')), {
      foo: 2,
      bar: 3
    });
    assert.throws(() => decode(fromHex('a3636261720363666f6f0163666f6f02'), { rejectDuplicateMapKeys: true }), /CBOR decode error: found repeat map key "foo"/);
    assert.throws(() => decode(fromHex('a3636261720363666f6f0163666f6f02'), {
      useMaps: true,
      rejectDuplicateMapKeys: true
    }), /CBOR decode error: found repeat map key "foo"/);
  });
});