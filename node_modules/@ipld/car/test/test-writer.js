/* eslint-env mocha */
/* globals describe, it */

import { CarWriter } from '@ipld/car/writer'
import { CarReader } from '@ipld/car/reader'
import { bytes, CID } from 'multiformats'
import { carBytes, makeData, assert, rndCid } from './common.js'
import {
  verifyRoots,
  verifyHas,
  verifyGet,
  verifyBlocks,
  verifyCids
} from './verify-store-reader.js'

/**
 * @typedef {import('../api').Block} Block
 */

const { toHex } = bytes

/**
 * @param {Uint8Array[]} chunks
 */
function concatBytes (chunks) {
  const length = chunks.reduce((p, c) => p + c.length, 0)
  const bytes = new Uint8Array(length)
  let off = 0
  for (const chunk of chunks) {
    bytes.set(chunk, off)
    off += chunk.length
  }
  return bytes
}

/**
 * @param {AsyncIterable<Uint8Array>} iterable
 */
function collector (iterable) {
  const chunks = []
  const cfn = (async () => {
    for await (const chunk of iterable) {
      chunks.push(chunk)
    }
    return concatBytes(chunks)
  })()
  return cfn
}

const newRoots = [
  CID.parse('bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq'),
  CID.parse('bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4')
]

/**
 * @param {Uint8Array} bytes
 */
async function verifyUpdateRoots (bytes) {
  const reader = await CarReader.fromBytes(bytes)
  await assert.isRejected(verifyRoots(reader)) // whoa, different roots? like magic
  assert.deepEqual(await reader.getRoots(), newRoots)
  await verifyHas(reader)
  await verifyGet(reader)
  await verifyBlocks(reader.blocks(), true)
  await verifyCids(reader.cids(), true)
}

describe('CarWriter', () => {
  /** @type {Block[]} */
  let cborBlocks
  /** @type {[string, Block[]][]} */
  let allBlocks
  /** @type {Block[]} */
  let allBlocksFlattened
  /** @type {CID[]} */
  let roots

  /**
   * @param {Uint8Array} actual
   */
  function assertCarData (actual) {
    assert.strictEqual(
      toHex(actual),
      toHex(carBytes),
      'got expected bytes'
    )
  }

  before(async () => {
    const data = await makeData()
    cborBlocks = data.cborBlocks
    allBlocks = data.allBlocks
    allBlocksFlattened = data.allBlocksFlattened
    roots = [cborBlocks[0].cid, cborBlocks[1].cid]
  })

  it('complete', async () => {
    const { writer, out } = CarWriter.create(roots)

    // writer is async iterable
    assert.strictEqual(typeof out[Symbol.asyncIterator], 'function')
    const collection = collector(out)

    const writeQueue = []
    for (const block of allBlocksFlattened) {
      writeQueue.push(writer.put(block))
    }
    writeQueue.push(writer.close())

    let collected = false
    collection.then((bytes) => {
      collected = true
      assertCarData(bytes)
    })
    await Promise.all(writeQueue)
    assert.strictEqual(collected, true)
  })

  it('complete, deferred collection', async () => {
    const { writer, out } = CarWriter.create(roots)

    const writeQueue = []
    for (const block of allBlocksFlattened) {
      writeQueue.push(writer.put(block))
    }
    writeQueue.push(writer.close())

    // attach to the iterator after we've queued all the writing
    let collected = false
    collector(out).then((bytes) => {
      collected = true
      assertCarData(bytes)
    })
    await Promise.all(writeQueue)
    assert.strictEqual(collected, true)
  })

  it('complete, close after write', async () => {
    const { writer, out } = CarWriter.create(roots)

    assert.strictEqual(typeof out[Symbol.asyncIterator], 'function')
    const collection = collector(out)

    const writeQueue = []
    for (const block of allBlocksFlattened) {
      writeQueue.push(writer.put(block))
    }
    writeQueue.push(writer.close())

    let written = false
    Promise.all(writeQueue).then(() => {
      written = true
    })
    const bytes = await collection
    assert.strictEqual(written, false)
    await Promise.resolve()
    assertCarData(bytes)
  })

  it('complete, no queue', async () => {
    const { writer, out } = CarWriter.create(roots)
    const collection = collector(out)

    for (const block of allBlocksFlattened) {
      await writer.put(block)
    }
    await writer.close()

    const bytes = await collection
    assertCarData(bytes)
  })

  it('complete, slow drip', async () => {
    const { writer, out } = CarWriter.create(roots)

    // writer is async iterable
    assert.strictEqual(typeof out[Symbol.asyncIterator], 'function')
    const collection = collector(out)

    for (const block of allBlocksFlattened) {
      writer.put(block)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await writer.close()

    await new Promise((resolve) => setTimeout(resolve, 100))

    const bytes = await collection
    assertCarData(bytes)
  })

  it('complete, no queue, deferred collection', async () => {
    const { writer, out } = CarWriter.create(roots)

    for (const block of allBlocksFlattened) {
      writer.put(block)
    }
    writer.close()

    const collection = collector(out)
    const bytes = await collection
    assertCarData(bytes)
  })

  it('single root', async () => {
    const { writer, out } = CarWriter.create(roots[0])
    const collection = collector(out)

    for (const block of allBlocksFlattened) {
      await writer.put(block)
    }
    await writer.close()

    const bytes = await collection

    // test the start of the bytes to make sure we have the root def block we expect
    // { roots: [ CID(bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm) ], version: 1 }
    const expectedRootDef = 'a265726f6f747381d82a58250001711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8b6776657273696f6e01'
    const expectedStart = (expectedRootDef.length / 2).toString(16) + // length of root def block
      expectedRootDef +
      '28' // length of first raw block + CIDv0

    assert.strictEqual(toHex(bytes).substring(0, expectedStart.length), expectedStart)
  })

  it('no roots', async () => {
    const { writer, out } = CarWriter.create()
    const collection = collector(out)

    for (const block of allBlocksFlattened) {
      await writer.put(block)
    }
    await writer.close()

    const bytes = await collection

    // test the start of the bytes to make sure we have the root def block we expect
    // { roots: [], version: 1 }
    const expectedRootDef = 'a265726f6f7473806776657273696f6e01'
    const expectedStart = (expectedRootDef.length / 2).toString(16) + // length of root def block
      expectedRootDef +
      '28' // length of first raw block + CIDv0

    assert.strictEqual(toHex(bytes).substring(0, expectedStart.length), expectedStart)
  })

  it('appender', async () => {
    let writerOut = CarWriter.create(roots)
    let collection = collector(writerOut.out)
    await writerOut.writer.close()
    const headerBytes = await collection

    /** @param {number} index */
    const append = async (index) => {
      writerOut = CarWriter.createAppender()
      collection = collector(writerOut.out)
      for (const block of allBlocks[index][1]) {
        await writerOut.writer.put(block)
      }
      await writerOut.writer.close()
      return collection
    }

    const rawBytes = await append(0)
    const pbBytes = await append(1)
    const cborBytes = await append(2)

    assert(rawBytes.length > 0)
    assert(pbBytes.length > 0)
    assert(cborBytes.length > 0)

    const reassembled = concatBytes([headerBytes, rawBytes, pbBytes, cborBytes])

    assert.strictEqual(toHex(reassembled), toHex(carBytes))
  })

  it('bad argument for create()', () => {
    for (const arg of [new Uint8Array(0), true, false, null, 'string', 100, { obj: 'nope' }, [false]]) {
      // @ts-ignore
      assert.throws(() => CarWriter.create(arg))
    }
  })

  it('bad argument for put()', async () => {
    const { writer } = CarWriter.create()
    for (const arg of [new Uint8Array(0), true, false, null, 'string', 100, { obj: 'nope' }, [false]]) {
      // @ts-ignore
      await assert.isRejected(writer.put(arg))
    }

    for (const arg of [true, false, null, 'string', 100, { obj: 'nope' }, [false]]) {
      // @ts-ignore
      await assert.isRejected(writer.put({ bytes: new Uint8Array(0), cid: arg }))
    }

    for (const arg of [true, false, null, 'string', 100, { obj: 'nope' }, [false]]) {
      // @ts-ignore
      await assert.isRejected(writer.put({ cid: rndCid, bytes: arg }))
    }
  })

  it('bad write after closed', async () => {
    const { writer, out } = CarWriter.create()
    const collection = collector(out)
    await writer.put(allBlocksFlattened[0])
    await writer.close()
    await assert.isRejected(writer.put(allBlocksFlattened[1]), /closed/)
    await collection
  })

  it('bad attempt to multiple iterate', async () => {
    const { out } = CarWriter.create()
    collector(out)
    await assert.isRejected(collector(out), /multiple iterator/i)
  })

  it('bad attempt to multiple close', async () => {
    const { writer, out } = CarWriter.create()
    collector(out)
    await writer.close()
    await assert.isRejected(writer.close(), /closed/i)
  })

  it('update roots (fd)', async () => {
    const bytes = carBytes.slice()
    await CarWriter.updateRootsInBytes(bytes, newRoots)
    await verifyUpdateRoots(bytes)
  })

  it('update roots error: wrong header size', async () => {
    const bytes = carBytes.slice()
    await assert.isRejected(CarWriter.updateRootsInBytes(bytes, [...newRoots, newRoots[0]]), /can only overwrite a header of the same length/)
    await assert.isRejected(CarWriter.updateRootsInBytes(bytes, [newRoots[0]]), /can only overwrite a header of the same length/)
    await assert.isRejected(CarWriter.updateRootsInBytes(bytes, []), /can only overwrite a header of the same length/)
  })
})
