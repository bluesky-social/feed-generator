import { Tokeniser } from './decode.js'
import { toHex, fromHex } from './byte-utils.js'
import { uintBoundaries } from './0uint.js'

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

/**
 * @param {Uint8Array} inp
 * @param {number} [width]
 */
function * tokensToDiagnostic (inp, width = 100) {
  const tokeniser = new Tokeniser(inp, { retainStringBytes: true, allowBigInt: true })
  let pos = 0
  const indent = []

  /**
   * @param {number} start
   * @param {number} length
   * @returns {string}
   */
  const slc = (start, length) => {
    return toHex(inp.slice(pos + start, pos + start + length))
  }

  while (!tokeniser.done()) {
    const token = tokeniser.next()
    let margin = ''.padStart(indent.length * 2, ' ')
    // @ts-ignore should be safe for decode
    let vLength = token.encodedLength - 1
    /** @type {string|number} */
    let v = String(token.value)
    let outp = `${margin}${slc(0, 1)}`
    const str = token.type.name === 'bytes' || token.type.name === 'string'
    if (token.type.name === 'string') {
      v = v.length
      vLength -= v
    } else if (token.type.name === 'bytes') {
      v = token.value.length
      // @ts-ignore
      vLength -= v
    }

    let multilen
    switch (token.type.name) {
      case 'string':
      case 'bytes':
      case 'map':
      case 'array':
        // for bytes and string, we want to print out the length part of the value prefix if it
        // exists - it exists for short lengths (<24) but does for longer lengths
        multilen = token.type.name === 'string' ? utf8Encoder.encode(token.value).length : token.value.length
        if (multilen >= uintBoundaries[0]) {
          if (multilen < uintBoundaries[1]) {
            outp += ` ${slc(1, 1)}`
          } else if (multilen < uintBoundaries[2]) {
            outp += ` ${slc(1, 2)}`
            /* c8 ignore next 5 */
          } else if (multilen < uintBoundaries[3]) { // sus
            outp += ` ${slc(1, 4)}`
          } else if (multilen < uintBoundaries[4]) { // orly?
            outp += ` ${slc(1, 8)}`
          }
        }
        break
      default:
        // print the value if it's not compacted into the first byte
        outp += ` ${slc(1, vLength)}`
        break
    }

    outp = outp.padEnd(width / 2, ' ')
    outp += `# ${margin}${token.type.name}`
    if (token.type.name !== v) {
      outp += `(${v})`
    }
    yield outp

    if (str) {
      let asString = token.type.name === 'string'
      margin += '  '
      let repr = asString ? utf8Encoder.encode(token.value) : token.value
      if (asString && token.byteValue !== undefined) {
        if (repr.length !== token.byteValue.length) {
          // bail on printing this as a string, it's probably not utf8, so treat it as bytes
          // (you can probably blame a Go programmer for this)
          repr = token.byteValue
          asString = false
        }
      }
      const wh = ((width / 2) - margin.length - 1) / 2
      let snip = 0
      while (repr.length - snip > 0) {
        const piece = repr.slice(snip, snip + wh)
        snip += piece.length
        const st = asString
          ? utf8Decoder.decode(piece)
          : piece.reduce((/** @type {string} */ p, /** @type {number} */ c) => {
            if (c < 0x20 || (c >= 0x7f && c < 0xa1) || c === 0xad) {
              return `${p}\\x${c.toString(16).padStart(2, '0')}`
            }
            return `${p}${String.fromCharCode(c)}`
          }, '')
        yield `${margin}${toHex(piece)}`.padEnd(width / 2, ' ') + `# ${margin}"${st}"`
      }
    }

    if (indent.length) {
      indent[indent.length - 1]--
    }
    if (!token.type.terminal) {
      switch (token.type.name) {
        case 'map':
          indent.push(token.value * 2)
          break
        case 'array':
          indent.push(token.value)
          break
        // TODO: test tags .. somehow
        /* c8 ignore next 5 */
        case 'tag':
          indent.push(1)
          break
        default:
          throw new Error(`Unknown token type '${token.type.name}'`)
      }
    }
    while (indent.length && indent[indent.length - 1] <= 0) {
      indent.pop()
    }
    // @ts-ignore it should be set on a decode operation
    pos += token.encodedLength
  }
}

/**
 * Convert an input string formatted as CBOR diagnostic output into binary CBOR form.
 * @param {string} input
 * @returns {Uint8Array}
 */
function fromDiag (input) {
  /* c8 ignore next 3 */
  if (typeof input !== 'string') {
    throw new TypeError('Expected string input')
  }
  input = input.replace(/#.*?$/mg, '').replace(/[\s\r\n]+/mg, '')
  /* c8 ignore next 3 */
  if (/[^a-f0-9]/i.test(input)) {
    throw new TypeError('Input string was not CBOR diagnostic format')
  }
  return fromHex(input)
}

export { tokensToDiagnostic, fromDiag }
