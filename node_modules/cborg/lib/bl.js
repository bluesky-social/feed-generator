/**
 * Bl is a list of byte chunks, similar to https://github.com/rvagg/bl but for
 * writing rather than reading.
 * A Bl object accepts set() operations for individual bytes and copyTo() for
 * inserting byte arrays. These write operations don't automatically increment
 * the internal cursor so its "length" won't be changed. Instead, increment()
 * must be called to extend its length to cover the inserted data.
 * The toBytes() call will convert all internal memory to a single Uint8Array of
 * the correct length, truncating any data that is stored but hasn't been
 * included by an increment().
 * get() can retrieve a single byte.
 * All operations (except toBytes()) take an "offset" argument that will perform
 * the write at the offset _from the current cursor_. For most operations this
 * will be `0` to write at the current cursor position but it can be ahead of
 * the current cursor. Negative offsets probably work but are untested.
 */

// TODO: ipjs doesn't support this, only for test files: https://github.com/mikeal/ipjs/blob/master/src/package/testFile.js#L39
import { alloc, concat, slice } from './byte-utils.js'

// the ts-ignores in this file are almost all for the `Uint8Array|number[]` duality that exists
// for perf reasons. Consider better approaches to this or removing it entirely, it is quite
// risky because of some assumptions about small chunks === number[] and everything else === Uint8Array.

const defaultChunkSize = 256

export class Bl {
  /**
   * @param {number} [chunkSize]
   */
  constructor (chunkSize = defaultChunkSize) {
    this.chunkSize = chunkSize
    /** @type {number} */
    this.cursor = 0
    /** @type {number} */
    this.maxCursor = -1
    /** @type {(Uint8Array|number[])[]} */
    this.chunks = []
    // keep the first chunk around if we can to save allocations for future encodes
    /** @type {Uint8Array|number[]|null} */
    this._initReuseChunk = null
  }

  reset () {
    this.cursor = 0
    this.maxCursor = -1
    if (this.chunks.length) {
      this.chunks = []
    }
    if (this._initReuseChunk !== null) {
      this.chunks.push(this._initReuseChunk)
      this.maxCursor = this._initReuseChunk.length - 1
    }
  }

  /**
   * @param {Uint8Array|number[]} bytes
   */
  push (bytes) {
    let topChunk = this.chunks[this.chunks.length - 1]
    const newMax = this.cursor + bytes.length
    if (newMax <= this.maxCursor + 1) {
      // we have at least one chunk and we can fit these bytes into that chunk
      const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1
      // @ts-ignore
      topChunk.set(bytes, chunkPos)
    } else {
      // can't fit it in
      if (topChunk) {
        // trip the last chunk to `cursor` if we need to
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1
        if (chunkPos < topChunk.length) {
          // @ts-ignore
          this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos)
          this.maxCursor = this.cursor - 1
        }
      }
      if (bytes.length < 64 && bytes.length < this.chunkSize) {
        // make a new chunk and copy the new one into it
        topChunk = alloc(this.chunkSize)
        this.chunks.push(topChunk)
        this.maxCursor += topChunk.length
        if (this._initReuseChunk === null) {
          this._initReuseChunk = topChunk
        }
        // @ts-ignore
        topChunk.set(bytes, 0)
      } else {
        // push the new bytes in as its own chunk
        this.chunks.push(bytes)
        this.maxCursor += bytes.length
      }
    }
    this.cursor += bytes.length
  }

  /**
   * @param {boolean} [reset]
   * @returns {Uint8Array}
   */
  toBytes (reset = false) {
    let byts
    if (this.chunks.length === 1) {
      const chunk = this.chunks[0]
      if (reset && this.cursor > chunk.length / 2) {
        /* c8 ignore next 2 */
        // @ts-ignore
        byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor)
        this._initReuseChunk = null
        this.chunks = []
      } else {
        // @ts-ignore
        byts = slice(chunk, 0, this.cursor)
      }
    } else {
      // @ts-ignore
      byts = concat(this.chunks, this.cursor)
    }
    if (reset) {
      this.reset()
    }
    return byts
  }
}
