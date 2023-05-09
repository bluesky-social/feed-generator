import varint from 'varint'
import { CID } from 'multiformats/cid'
import * as Digest from 'multiformats/hashes/digest'
import { decode as decodeDagCbor } from '@ipld/dag-cbor'

/**
 * @typedef {import('../api').Block} Block
 * @typedef {import('../api').BlockHeader} BlockHeader
 * @typedef {import('../api').BlockIndex} BlockIndex
 * @typedef {import('./coding').BytesReader} BytesReader
 * @typedef {import('./coding').CarHeader} CarHeader
 * @typedef {import('./coding').CarDecoder} CarDecoder
 */

const CIDV0_BYTES = {
  SHA2_256: 0x12,
  LENGTH: 0x20,
  DAG_PB: 0x70
}

/**
 * @param {BytesReader} reader
 * @returns {Promise<number>}
 */
async function readVarint (reader) {
  const bytes = await reader.upTo(8)
  const i = varint.decode(bytes)
  reader.seek(varint.decode.bytes)
  return i
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @returns {Promise<CarHeader>}
 */
export async function readHeader (reader) {
  const length = await readVarint(reader)
  if (length === 0) {
    throw new Error('Invalid CAR header (zero length)')
  }
  const header = await reader.exactly(length)
  reader.seek(length)
  const block = decodeDagCbor(header)
  if (block == null || Array.isArray(block) || typeof block !== 'object') {
    throw new Error('Invalid CAR header format')
  }
  if (block.version !== 1) {
    if (typeof block.version === 'string') {
      throw new Error(`Invalid CAR version: "${block.version}"`)
    }
    throw new Error(`Invalid CAR version: ${block.version}`)
  }
  if (!Array.isArray(block.roots)) {
    throw new Error('Invalid CAR header format')
  }
  if (Object.keys(block).filter((p) => p !== 'roots' && p !== 'version').length) {
    throw new Error('Invalid CAR header format')
  }
  return block
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @returns {Promise<Uint8Array>}
 */
async function readMultihash (reader) {
  // | code | length | .... |
  // where both code and length are varints, so we have to decode
  // them first before we can know total length

  const bytes = await reader.upTo(8)
  varint.decode(bytes) // code
  const codeLength = varint.decode.bytes
  const length = varint.decode(bytes.subarray(varint.decode.bytes))
  const lengthLength = varint.decode.bytes
  const mhLength = codeLength + lengthLength + length
  const multihash = await reader.exactly(mhLength)
  reader.seek(mhLength)
  return multihash
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @returns {Promise<CID>}
 */
async function readCid (reader) {
  const first = await reader.exactly(2)
  if (first[0] === CIDV0_BYTES.SHA2_256 && first[1] === CIDV0_BYTES.LENGTH) {
    // cidv0 32-byte sha2-256
    const bytes = await reader.exactly(34)
    reader.seek(34)
    const multihash = Digest.decode(bytes)
    return CID.create(0, CIDV0_BYTES.DAG_PB, multihash)
  }

  const version = await readVarint(reader)
  if (version !== 1) {
    throw new Error(`Unexpected CID version (${version})`)
  }
  const codec = await readVarint(reader)
  const bytes = await readMultihash(reader)
  const multihash = Digest.decode(bytes)
  return CID.create(version, codec, multihash)
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @returns {Promise<BlockHeader>}
 */
export async function readBlockHead (reader) {
  // length includes a CID + Binary, where CID has a variable length
  // we have to deal with
  const start = reader.pos
  let length = await readVarint(reader)
  if (length === 0) {
    throw new Error('Invalid CAR section (zero length)')
  }
  length += (reader.pos - start)
  const cid = await readCid(reader)
  const blockLength = length - (reader.pos - start) // subtract CID length

  return { cid, length, blockLength }
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @return {Promise<Block>}
 */
async function readBlock (reader) {
  const { cid, blockLength } = await readBlockHead(reader)
  const bytes = await reader.exactly(blockLength)
  reader.seek(blockLength)
  return { bytes, cid }
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @returns {Promise<BlockIndex>}
 */
async function readBlockIndex (reader) {
  const offset = reader.pos
  const { cid, length, blockLength } = await readBlockHead(reader)
  const index = { cid, length, blockLength, offset, blockOffset: reader.pos }
  reader.seek(index.blockLength)
  return index
  /* c8 ignore next 2 */
  // Node.js 12 c8 bug
}

/**
 * @param {BytesReader} reader
 * @returns {CarDecoder}
 */
export function createDecoder (reader) {
  const headerPromise = readHeader(reader)

  return {
    header: () => headerPromise,

    async * blocks () {
      await headerPromise
      while ((await reader.upTo(8)).length > 0) {
        yield await readBlock(reader)
      }
    },

    async * blocksIndex () {
      await headerPromise
      while ((await reader.upTo(8)).length > 0) {
        yield await readBlockIndex(reader)
      }
    }
  }
}

/**
 * @param {Uint8Array} bytes
 * @returns {BytesReader}
 */
export function bytesReader (bytes) {
  let pos = 0

  /** @type {BytesReader} */
  return {
    async upTo (length) {
      return bytes.subarray(pos, pos + Math.min(length, bytes.length - pos))
      /* c8 ignore next 2 */
      // Node.js 12 c8 bug
    },

    async exactly (length) {
      if (length > bytes.length - pos) {
        throw new Error('Unexpected end of data')
      }
      return bytes.subarray(pos, pos + length)
      /* c8 ignore next 2 */
      // Node.js 12 c8 bug
    },

    seek (length) {
      pos += length
    },

    get pos () {
      return pos
    }
  }
}

/**
 * @ignore
 * reusable reader for streams and files, we just need a way to read an
 * additional chunk (of some undetermined size) and a way to close the
 * reader when finished
 * @param {() => Promise<Uint8Array|null>} readChunk
 * @returns {BytesReader}
 */
export function chunkReader (readChunk /*, closer */) {
  let pos = 0
  let have = 0
  let offset = 0
  let currentChunk = new Uint8Array(0)

  const read = async (/** @type {number} */ length) => {
    have = currentChunk.length - offset
    const bufa = [currentChunk.subarray(offset)]
    while (have < length) {
      const chunk = await readChunk()
      if (chunk == null) {
        break
      }
      /* c8 ignore next 8 */
      // undo this ignore ^ when we have a fd implementation that can seek()
      if (have < 0) { // because of a seek()
        /* c8 ignore next 4 */
        // toohard to test the else
        if (chunk.length > have) {
          bufa.push(chunk.subarray(-have))
        } // else discard
      } else {
        bufa.push(chunk)
      }
      have += chunk.length
    }
    currentChunk = new Uint8Array(bufa.reduce((p, c) => p + c.length, 0))
    let off = 0
    for (const b of bufa) {
      currentChunk.set(b, off)
      off += b.length
    }
    offset = 0
  }

  /** @type {BytesReader} */
  return {
    async upTo (length) {
      if (currentChunk.length - offset < length) {
        await read(length)
      }
      return currentChunk.subarray(offset, offset + Math.min(currentChunk.length - offset, length))
      /* c8 ignore next 2 */
      // Node.js 12 c8 bug
    },

    async exactly (length) {
      if (currentChunk.length - offset < length) {
        await read(length)
      }
      if (currentChunk.length - offset < length) {
        throw new Error('Unexpected end of data')
      }
      return currentChunk.subarray(offset, offset + length)
      /* c8 ignore next 2 */
      // Node.js 12 c8 bug
    },

    seek (length) {
      pos += length
      offset += length
    },

    get pos () {
      return pos
    }
  }
}

/**
 * @param {AsyncIterable<Uint8Array>} asyncIterable
 * @returns {BytesReader}
 */
export function asyncIterableReader (asyncIterable) {
  const iterator = asyncIterable[Symbol.asyncIterator]()

  async function readChunk () {
    const next = await iterator.next()
    if (next.done) {
      return null
    }
    return next.value
    /* c8 ignore next 2 */
    // Node.js 12 c8 bug
  }

  return chunkReader(readChunk)
}
