/* eslint-env mocha */
import { bytes } from 'multiformats'
import { encode as cbEncode } from '@ipld/dag-cbor'
import { encode as vEncode } from 'varint'
import { CarReader } from '@ipld/car/reader'
import { carBytes, assert } from './common.js'

/**
 * @param {any} block
 * @returns {Uint8Array}
 */
function makeHeader (block) {
  const u = cbEncode(block)
  const l = vEncode(u.length)
  const u2 = new Uint8Array(u.length + l.length)
  u2.set(l, 0)
  u2.set(u, l.length)
  return u2
}

describe('Misc errors', () => {
  const buf = carBytes.slice()

  it('decode errors', async () => {
    // cid v0
    const buf2 = new Uint8Array(buf.length)
    buf2.set(buf, 0)
    buf2[101] = 0 // first block's CID
    await assert.isRejected(CarReader.fromBytes(buf2), {
      name: 'Error',
      message: 'Unexpected CID version (0)'
    })
  })

  it('bad version', async () => {
    // quick sanity check that makeHeader() works properly!
    const buf2 = bytes.fromHex('0aa16776657273696f6e02')
    // {version:2} - fixed string, likely to be used by CARv2 to escape header parsing rules
    assert.strictEqual(bytes.toHex(makeHeader({ version: 2 })), '0aa16776657273696f6e02')
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR version: 2')
  })

  it('bad header', async () => {
    // sanity check, this should be fine
    let buf2 = makeHeader({ version: 1, roots: [] })
    await assert.isFulfilled(CarReader.fromBytes(buf2))

    // no 'version' array
    buf2 = makeHeader({ roots: [] })
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR version: undefined')

    // bad 'version' type
    buf2 = makeHeader({ version: '1', roots: [] })
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR version: "1"')

    // no 'roots' array
    buf2 = makeHeader({ version: 1 })
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format')

    // bad 'roots' type
    buf2 = makeHeader({ version: 1, roots: {} })
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format')

    // extraneous properties
    buf2 = makeHeader({ version: 1, roots: [], blip: true })
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format')

    // not an object
    buf2 = makeHeader([1, []])
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format')

    // not an object
    buf2 = makeHeader(null)
    await assert.isRejected(CarReader.fromBytes(buf2), Error, 'Invalid CAR header format')
  })
})
