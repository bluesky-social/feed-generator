/* globals describe, it */
import * as codec from 'multiformats/codecs/json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import * as main from 'multiformats/block'
import { CID, bytes } from 'multiformats'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const { assert } = chai

const fixture = { hello: 'world' }
const link = CID.parse('bafyreidykglsfhoixmivffc5uwhcgshx4j465xwqntbmu43nb2dzqwfvae')
const buff = bytes.fromString('sadf')

describe('block', () => {
  it('basic encode/decode roundtrip', async () => {
    const block = await main.encode({ value: fixture, codec, hasher })
    const block2 = await main.decode({ bytes: block.bytes, codec, hasher })
    assert.deepStrictEqual(block.cid.equals(block2.cid), true)
    assert.deepStrictEqual(block.cid.equals(block2.cid), true)
    assert.deepStrictEqual(fixture, block2.value)
    const block3 = await main.create({ bytes: block.bytes, cid: block.cid, codec, hasher })
    assert.deepStrictEqual(block3.cid.equals(block2.cid), true)
  })

  it('createUnsafe', async () => {
    const block = await main.encode({ value: fixture, codec, hasher })
    const block2 = main.createUnsafe({ bytes: block.bytes, cid: block.cid, codec })
    assert.deepStrictEqual(block.cid.equals(block2.cid), true)
  })

  describe('reader', () => {
    const value = {
      link,
      nope: 'skip',
      arr: [link],
      obj: { arr: [{ obj: {} }] },
      // @ts-expect-error - 'string' is not assignable to parameter of type 'ArrayLike<number>'
      bytes: Uint8Array.from('1234')
    }
    // @ts-expect-error - 'boolean' is not assignable to type 'CID'
    const block = main.createUnsafe({ value, codec, hasher, cid: true, bytes: true })

    it('links', () => {
      const expected = ['link', 'arr/0']
      for (const [path, cid] of block.links()) {
        assert.deepStrictEqual(path, expected.shift())
        assert.deepStrictEqual(cid.toString(), link.toString())
      }
    })

    it('tree', () => {
      const expected = ['link', 'nope', 'arr', 'arr/0', 'obj', 'obj/arr', 'obj/arr/0', 'obj/arr/0/obj', 'bytes']
      for (const path of block.tree()) {
        assert.deepStrictEqual(path, expected.shift())
      }
    })

    it('get', () => {
      let ret = block.get('link/test')
      assert.deepStrictEqual(ret.remaining, 'test')
      assert.deepStrictEqual(ret.value.toString(), link.toString())
      ret = block.get('nope')
      // @ts-expect-error - 'string' is not expected
      assert.deepStrictEqual(ret, { value: 'skip' })
    })

    it('null links/tree', () => {
      const block = main.createUnsafe({
        value: null,
        codec,
        hasher,
        // @ts-expect-error - 'boolean' is not assignable to type 'ByteView<unknown>'
        bytes: true,
        // @ts-expect-error - 'boolean' is not assignable to type 'CID'
        cid: true
      })
      // eslint-disable-next-line
      for (const x of block.tree()) {
        throw new Error(`tree should have nothing, got "${x}"`)
      }
      // eslint-disable-next-line
      for (const x of block.links()) {
        throw new Error(`links should have nothing, got "${x}"`)
      }
    })
  })

  it('kitchen sink', () => {
    const sink = { one: { two: { arr: [true, false, null], three: 3, buff, link } } }
    const block = main.createUnsafe({
      value: sink,
      codec,
      // @ts-expect-error - 'boolean' is not assignable to type 'ByteView<unknown>'
      bytes: true,
      // @ts-expect-error - 'boolean' is not assignable to type 'CID'
      cid: true
    })
    assert.deepStrictEqual(sink, block.value)
  })

  describe('errors', () => {
    it('constructor missing args', () => {
      assert.throws(
        // @ts-expect-error - missing properties
        () => new main.Block({}),
        'Missing required argument'
      )
    })

    it('encode', async () => {
      // @ts-expect-error
      await assert.isRejected(main.encode({}), 'Missing required argument "value"')
      // @ts-expect-error
      await assert.isRejected(main.encode({ value: true }), 'Missing required argument: codec or hasher')
    })

    it('decode', async () => {
      // @ts-expect-error
      await assert.isRejected(main.decode({}), 'Missing required argument "bytes"')
      // @ts-expect-error
      await assert.isRejected(main.decode({ bytes: true }), 'Missing required argument: codec or hasher')
    })

    it('createUnsafe', async () => {
      // @ts-expect-error
      assert.throws(() => main.createUnsafe({}), 'Missing required argument, must either provide "value" or "codec"')
    })

    it('create', async () => {
      // @ts-expect-error
      await assert.isRejected(main.create({}), 'Missing required argument "bytes"')
      // @ts-expect-error
      await assert.isRejected(main.create({ bytes: true }), 'Missing required argument "hasher"')
      const block = await main.encode({ value: fixture, codec, hasher })
      const block2 = await main.encode({ value: { ...fixture, test: 'blah' }, codec, hasher })
      await assert.isRejected(main.create({ bytes: block.bytes, cid: block2.cid, codec, hasher }), 'CID hash does not match bytes')
    })

    it('get', async () => {
      const block = await main.encode({ value: fixture, codec, hasher })
      assert.throws(() => block.get('/asd/fs/dfasd/f'), 'Object has no property at ["asd"]')
    })
  })
})
