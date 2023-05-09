import { bytes } from 'multiformats';
import { encode as cbEncode } from '@ipld/dag-cbor';
import { encode as vEncode } from 'varint';
import { CarReader } from '../lib/reader.js';
import {
  carBytes,
  assert
} from './common.js';
function makeHeader(block) {
  const u = cbEncode(block);
  const l = vEncode(u.length);
  const u2 = new Uint8Array(u.length + l.length);
  u2.set(l, 0);
  u2.set(u, l.length);
  return u2;
}
describe('Misc errors', () => {
  const buf = carBytes.slice();
  it('decode errors', async () => {
    const buf2 = new Uint8Array(buf.length);
    buf2.set(buf, 0);
    buf2[101] = 0;
    await assert.isRejected(CarReader.fromBytes(buf2), {
      name: 'Error',
      message: 'Unexpected CID version (0)'
    });
  });
  it('bad version', async () => {
    const buf2 = bytes.fromHex('0aa16776657273696f6e02');
    assert.strictEqual(bytes.toHex(makeHeader({ version: 2 })), '0aa16776657273696f6e02');
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR version: 2');
  });
  it('bad header', async () => {
    let buf2 = makeHeader({
      version: 1,
      roots: []
    });
    await assert.isFulfilled(CarReader.fromBytes(buf2));
    buf2 = makeHeader({ roots: [] });
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR version: undefined');
    buf2 = makeHeader({
      version: '1',
      roots: []
    });
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR version: "1"');
    buf2 = makeHeader({ version: 1 });
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader({
      version: 1,
      roots: {}
    });
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader({
      version: 1,
      roots: [],
      blip: true
    });
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader([
      1,
      []
    ]);
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader(null);
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
  });
});