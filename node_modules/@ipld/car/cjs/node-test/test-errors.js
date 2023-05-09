'use strict';

var multiformats = require('multiformats');
var dagCbor = require('@ipld/dag-cbor');
var varint = require('varint');
var reader = require('../lib/reader.js');
var common = require('./common.js');

function makeHeader(block) {
  const u = dagCbor.encode(block);
  const l = varint.encode(u.length);
  const u2 = new Uint8Array(u.length + l.length);
  u2.set(l, 0);
  u2.set(u, l.length);
  return u2;
}
describe('Misc errors', () => {
  const buf = common.carBytes.slice();
  it('decode errors', async () => {
    const buf2 = new Uint8Array(buf.length);
    buf2.set(buf, 0);
    buf2[101] = 0;
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), {
      name: 'Error',
      message: 'Unexpected CID version (0)'
    });
  });
  it('bad version', async () => {
    const buf2 = multiformats.bytes.fromHex('0aa16776657273696f6e02');
    common.assert.strictEqual(multiformats.bytes.toHex(makeHeader({ version: 2 })), '0aa16776657273696f6e02');
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR version: 2');
  });
  it('bad header', async () => {
    let buf2 = makeHeader({
      version: 1,
      roots: []
    });
    await common.assert.isFulfilled(reader.CarReader.fromBytes(buf2));
    buf2 = makeHeader({ roots: [] });
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR version: undefined');
    buf2 = makeHeader({
      version: '1',
      roots: []
    });
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR version: "1"');
    buf2 = makeHeader({ version: 1 });
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader({
      version: 1,
      roots: {}
    });
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader({
      version: 1,
      roots: [],
      blip: true
    });
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader([
      1,
      []
    ]);
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
    buf2 = makeHeader(null);
    await common.assert.isRejected(reader.CarReader.fromBytes(buf2), Error, 'Invalid CAR header format');
  });
});
