const empty = new Uint8Array(0)

/**
 * @param {Uint8Array} d
 */
const toHex = d => d.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '')

/**
 * @param {string} hex
 */
const fromHex = hex => {
  const hexes = hex.match(/../g)
  return hexes ? new Uint8Array(hexes.map(b => parseInt(b, 16))) : empty
}

/**
 * @param {Uint8Array} aa
 * @param {Uint8Array} bb
 */
const equals = (aa, bb) => {
  if (aa === bb) return true
  if (aa.byteLength !== bb.byteLength) {
    return false
  }

  for (let ii = 0; ii < aa.byteLength; ii++) {
    if (aa[ii] !== bb[ii]) {
      return false
    }
  }

  return true
}

/**
 * @param {ArrayBufferView|ArrayBuffer|Uint8Array} o
 * @returns {Uint8Array}
 */
const coerce = o => {
  if (o instanceof Uint8Array && o.constructor.name === 'Uint8Array') return o
  if (o instanceof ArrayBuffer) return new Uint8Array(o)
  if (ArrayBuffer.isView(o)) {
    return new Uint8Array(o.buffer, o.byteOffset, o.byteLength)
  }
  throw new Error('Unknown type, must be binary type')
}

/**
 * @param {any} o
 * @returns {o is ArrayBuffer|ArrayBufferView}
 */
const isBinary = o =>
  o instanceof ArrayBuffer || ArrayBuffer.isView(o)

/**
 * @param {string} str
 * @returns {Uint8Array}
 */
const fromString = str => (new TextEncoder()).encode(str)

/**
 * @param {Uint8Array} b
 * @returns {string}
 */
const toString = b => (new TextDecoder()).decode(b)

export { equals, coerce, isBinary, fromHex, toHex, fromString, toString, empty }
