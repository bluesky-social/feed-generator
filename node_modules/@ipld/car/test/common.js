import { bytes, CID } from 'multiformats'
import { sha256 } from 'multiformats/hashes/sha2'
import * as raw from 'multiformats/codecs/raw'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

/**
 * @typedef {import('../api').Block} Block
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */

/**
 * @extends {Block}
 */
class TestBlock {
  /**
   * @param {Uint8Array} bytes
   * @param {CID} cid
   * @param {any} object
   */
  constructor (bytes, cid, object) {
    this.bytes = bytes
    this.cid = cid
    this.object = object
  }
}

chai.use(chaiAsPromised)
const { assert } = chai

/** @type {TestBlock[]} */
let rawBlocks
/** @type {TestBlock[]} */
const pbBlocks = []
/** @type {TestBlock[]} */
const cborBlocks = []
/** @type {[string, TestBlock[]][]} */
let allBlocks
/** @type {TestBlock[]} */
let allBlocksFlattened

const rndCid = CID.parse('bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm')

/**
 * @param {any} object
 * @param {{code: number, encode: (obj: any) => Uint8Array}} codec
 * @param {import('multiformats/cid').CIDVersion} version
 * @returns {Promise<TestBlock & { object: any }>}
 */
async function toBlock (object, codec, version = 1) {
  const bytes = codec.encode(object)
  const hash = await sha256.digest(bytes)
  const cid = CID.create(version, codec.code, hash)
  return new TestBlock(bytes, cid, object)
}

async function makeData () {
  if (!rawBlocks) {
    rawBlocks = await Promise.all('aaaa bbbb cccc zzzz'.split(' ').map((s) => {
      return toBlock(new TextEncoder().encode(s), raw)
    }))

    /**
     * @param {string} name
     * @param {TestBlock} block
     */
    const toPbLink = (name, block) => {
      let size = block.bytes.length
      if (block.cid.code === 0x70) {
        // special cumulative size handling for linking to dag-pb blocks
        /** @type {PBNode} */
        const node = block.object
        size = node.Links.reduce((p, c) => p + (c.Tsize || 0), size)
      }
      return {
        Name: name,
        Tsize: size,
        Hash: block.cid
      }
    }

    pbBlocks.push(await toBlock({ Links: [toPbLink('cat', rawBlocks[0])] }, dagPb, 0))
    pbBlocks.push(await toBlock({
      Links: [toPbLink('dog', rawBlocks[1]), toPbLink('first', pbBlocks[0])]
    }, dagPb, 0))
    pbBlocks.push(await toBlock({
      Links: [toPbLink('bear', rawBlocks[2]), toPbLink('second', pbBlocks[1])]
    }, dagPb, 0))

    const cbstructs = [['blip', pbBlocks[2].cid], ['limbo', null]]
    for (const b of cbstructs) {
      cborBlocks.push(await toBlock({ name: b[0], link: b[1] }, dagCbor))
    }

    allBlocks = [['raw', rawBlocks.slice(0, 3)], ['pb', pbBlocks], ['cbor', cborBlocks]]
    allBlocksFlattened = allBlocks.reduce((/** @type {TestBlock[]} */ p, c) => p.concat(c[1]), /** @type {TestBlock[]} */ [])
  }

  return {
    rawBlocks,
    pbBlocks,
    cborBlocks,
    allBlocks,
    allBlocksFlattened
  }
}

/**
 * @param {Uint8Array} data
 * @param {number} chunkSize
 * @returns {AsyncIterable<Uint8Array>}
 */
function makeIterable (data, chunkSize) {
  let pos = 0
  return {
    [Symbol.asyncIterator] () {
      return {
        async next () {
          await new Promise((resolve) => setTimeout(resolve, 5))
          if (pos >= data.length) {
            return { done: true, value: undefined }
          }
          const value = data.slice(pos, pos += chunkSize)
          return { done: false, value }
        }
      }
    }
  }
}

const carBytes = bytes.fromHex('63a265726f6f747382d82a58250001711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8bd82a5825000171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365b6776657273696f6e01280155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b461616161280155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e646877626262622801551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a2745163636363511220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d0122d0a240155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b4120363617418048001122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a122d0a240155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e6468771203646f671804122d0a221220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d01205666972737418338301122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de122e0a2401551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a274511204626561721804122f0a22122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a12067365636f6e641895015b01711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8ba2646c696e6bd82a582300122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de646e616d6564626c6970360171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365ba2646c696e6bf6646e616d65656c696d626f')
// go.car is written as a graph, not by the allBlocks ordering here, so ordering is slightly out
const goCarBytes = bytes.fromHex('63a265726f6f747382d82a58250001711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8bd82a5825000171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365b6776657273696f6e015b01711220f88bc853804cf294fe417e4fa83028689fcdb1b1592c5102e1474dbc200fab8ba2646c696e6bd82a582300122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de646e616d6564626c69708301122002acecc5de2438ea4126a3010ecb1f8a599c8eff22fff1a1dcffe999b27fd3de122e0a2401551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a274511204626561721804122f0a22122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a12067365636f6e641895012801551220b6fbd675f98e2abd22d4ed29fdc83150fedc48597e92dd1a7a24381d44a27451636363638001122079a982de3c9907953d4d323cee1d0fb1ed8f45f8ef02870c0cb9e09246bd530a122d0a240155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e6468771203646f671804122d0a221220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d0120566697273741833280155122081cc5b17018674b401b42f35ba07bb79e211239c23bffe658da1577e3e64687762626262511220e7dc486e97e6ebe5cdabab3e392bdad128b6e09acc94bb4e2aa2af7b986d24d0122d0a240155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b412036361741804280155122061be55a8e2f6b4e172338bddf184d6dbee29c98853e0a0485ecee7f27b9af0b461616161360171122069ea0740f9807a28f4d932c62e7c1c83be055e55072c90266ab3e79df63a365ba2646c696e6bf6646e616d65656c696d626f')

const goCarRoots = [
  CID.parse('bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm'),
  CID.parse('bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm')
]

const goCarIndex = [
  { cid: CID.parse('bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm'), offset: 100, length: 92, blockOffset: 137, blockLength: 55 },
  { cid: CID.parse('QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d'), offset: 192, length: 133, blockOffset: 228, blockLength: 97 },
  { cid: CID.parse('bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke'), offset: 325, length: 41, blockOffset: 362, blockLength: 4 },
  { cid: CID.parse('QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys'), offset: 366, length: 130, blockOffset: 402, blockLength: 94 },
  { cid: CID.parse('bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4'), offset: 496, length: 41, blockOffset: 533, blockLength: 4 },
  { cid: CID.parse('QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT'), offset: 537, length: 82, blockOffset: 572, blockLength: 47 },
  { cid: CID.parse('bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq'), offset: 619, length: 41, blockOffset: 656, blockLength: 4 },
  { cid: CID.parse('bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm'), offset: 660, length: 55, blockOffset: 697, blockLength: 18 }
]

export {
  toBlock,
  assert,
  makeData,
  makeIterable,
  rndCid,
  carBytes,
  goCarBytes,
  goCarRoots,
  goCarIndex
}
