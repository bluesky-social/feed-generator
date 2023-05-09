import basex from '../../vendor/base-x.js'
import { coerce } from '../bytes.js'

/**
 * @typedef {import('./interface').BaseEncoder} BaseEncoder
 * @typedef {import('./interface').BaseDecoder} BaseDecoder
 * @typedef {import('./interface').BaseCodec} BaseCodec
 */

/**
 * @template {string} T
 * @typedef {import('./interface').Multibase<T>} Multibase
 */
/**
 * @template {string} T
 * @typedef {import('./interface').MultibaseEncoder<T>} MultibaseEncoder
 */

/**
 * Class represents both BaseEncoder and MultibaseEncoder meaning it
 * can be used to encode to multibase or base encode without multibase
 * prefix.
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseEncoder<Prefix>}
 * @implements {BaseEncoder}
 */
class Encoder {
  /**
   * @param {Base} name
   * @param {Prefix} prefix
   * @param {(bytes:Uint8Array) => string} baseEncode
   */
  constructor (name, prefix, baseEncode) {
    this.name = name
    this.prefix = prefix
    this.baseEncode = baseEncode
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {Multibase<Prefix>}
   */
  encode (bytes) {
    if (bytes instanceof Uint8Array) {
      return `${this.prefix}${this.baseEncode(bytes)}`
    } else {
      throw Error('Unknown type, must be binary type')
    }
  }
}

/**
 * @template {string} Prefix
 * @typedef {import('./interface').MultibaseDecoder<Prefix>} MultibaseDecoder
 */

/**
 * @template {string} Prefix
 * @typedef {import('./interface').UnibaseDecoder<Prefix>} UnibaseDecoder
 */

/**
 * @template {string} Prefix
 */
/**
 * Class represents both BaseDecoder and MultibaseDecoder so it could be used
 * to decode multibases (with matching prefix) or just base decode strings
 * with corresponding base encoding.
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {UnibaseDecoder<Prefix>}
 * @implements {BaseDecoder}
 */
class Decoder {
  /**
   * @param {Base} name
   * @param {Prefix} prefix
   * @param {(text:string) => Uint8Array} baseDecode
   */
  constructor (name, prefix, baseDecode) {
    this.name = name
    this.prefix = prefix
    /* c8 ignore next 3 */
    if (prefix.codePointAt(0) === undefined) {
      throw new Error('Invalid prefix character')
    }
    /** @private */
    this.prefixCodePoint = /** @type {number} */ (prefix.codePointAt(0))
    this.baseDecode = baseDecode
  }

  /**
   * @param {string} text
   */
  decode (text) {
    if (typeof text === 'string') {
      if (text.codePointAt(0) !== this.prefixCodePoint) {
        throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`)
      }
      return this.baseDecode(text.slice(this.prefix.length))
    } else {
      throw Error('Can only multibase decode strings')
    }
  }

  /**
   * @template {string} OtherPrefix
   * @param {UnibaseDecoder<OtherPrefix>|ComposedDecoder<OtherPrefix>} decoder
   * @returns {ComposedDecoder<Prefix|OtherPrefix>}
   */
  or (decoder) {
    return or(this, decoder)
  }
}

/**
 * @template {string} Prefix
 * @typedef {import('./interface').CombobaseDecoder<Prefix>} CombobaseDecoder
 */

/**
 * @template {string} Prefix
 * @typedef {Record<Prefix, UnibaseDecoder<Prefix>>} Decoders
 */

/**
 * @template {string} Prefix
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {CombobaseDecoder<Prefix>}
 */
class ComposedDecoder {
  /**
   * @param {Record<Prefix, UnibaseDecoder<Prefix>>} decoders
   */
  constructor (decoders) {
    this.decoders = decoders
  }

  /**
   * @template {string} OtherPrefix
   * @param {UnibaseDecoder<OtherPrefix>|ComposedDecoder<OtherPrefix>} decoder
   * @returns {ComposedDecoder<Prefix|OtherPrefix>}
   */
  or (decoder) {
    return or(this, decoder)
  }

  /**
   * @param {string} input
   * @returns {Uint8Array}
   */
  decode (input) {
    const prefix = /** @type {Prefix} */ (input[0])
    const decoder = this.decoders[prefix]
    if (decoder) {
      return decoder.decode(input)
    } else {
      throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`)
    }
  }
}

/**
 * @template {string} L
 * @template {string} R
 * @param {UnibaseDecoder<L>|CombobaseDecoder<L>} left
 * @param {UnibaseDecoder<R>|CombobaseDecoder<R>} right
 * @returns {ComposedDecoder<L|R>}
 */
export const or = (left, right) => new ComposedDecoder(/** @type {Decoders<L|R>} */({
  ...(left.decoders || { [/** @type UnibaseDecoder<L> */(left).prefix]: left }),
  ...(right.decoders || { [/** @type UnibaseDecoder<R> */(right).prefix]: right })
}))

/**
 * @template T
 * @typedef {import('./interface').MultibaseCodec<T>} MultibaseCodec
 */

/**
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseCodec<Prefix>}
 * @implements {MultibaseEncoder<Prefix>}
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {BaseCodec}
 * @implements {BaseEncoder}
 * @implements {BaseDecoder}
 */
export class Codec {
  /**
   * @param {Base} name
   * @param {Prefix} prefix
   * @param {(bytes:Uint8Array) => string} baseEncode
   * @param {(text:string) => Uint8Array} baseDecode
   */
  constructor (name, prefix, baseEncode, baseDecode) {
    this.name = name
    this.prefix = prefix
    this.baseEncode = baseEncode
    this.baseDecode = baseDecode
    this.encoder = new Encoder(name, prefix, baseEncode)
    this.decoder = new Decoder(name, prefix, baseDecode)
  }

  /**
   * @param {Uint8Array} input
   */
  encode (input) {
    return this.encoder.encode(input)
  }

  /**
   * @param {string} input
   */
  decode (input) {
    return this.decoder.decode(input)
  }
}

/**
 * @template {string} Base
 * @template {string} Prefix
 * @param {Object} options
 * @param {Base} options.name
 * @param {Prefix} options.prefix
 * @param {(bytes:Uint8Array) => string} options.encode
 * @param {(input:string) => Uint8Array} options.decode
 * @returns {Codec<Base, Prefix>}
 */
export const from = ({ name, prefix, encode, decode }) =>
  new Codec(name, prefix, encode, decode)

/**
 * @template {string} Base
 * @template {string} Prefix
 * @param {Object} options
 * @param {Base} options.name
 * @param {Prefix} options.prefix
 * @param {string} options.alphabet
 * @returns {Codec<Base, Prefix>}
 */
export const baseX = ({ prefix, name, alphabet }) => {
  const { encode, decode } = basex(alphabet, name)
  return from({
    prefix,
    name,
    encode,
    /**
     * @param {string} text
     */
    decode: text => coerce(decode(text))
  })
}

/**
 * @param {string} string
 * @param {string} alphabet
 * @param {number} bitsPerChar
 * @param {string} name
 * @returns {Uint8Array}
 */
const decode = (string, alphabet, bitsPerChar, name) => {
  // Build the character lookup table:
  /** @type {Record<string, number>} */
  const codes = {}
  for (let i = 0; i < alphabet.length; ++i) {
    codes[alphabet[i]] = i
  }

  // Count the padding bytes:
  let end = string.length
  while (string[end - 1] === '=') {
    --end
  }

  // Allocate the output:
  const out = new Uint8Array((end * bitsPerChar / 8) | 0)

  // Parse the data:
  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  let written = 0 // Next byte to write
  for (let i = 0; i < end; ++i) {
    // Read one character from the string:
    const value = codes[string[i]]
    if (value === undefined) {
      throw new SyntaxError(`Non-${name} character`)
    }

    // Append the bits to the buffer:
    buffer = (buffer << bitsPerChar) | value
    bits += bitsPerChar

    // Write out some bits if the buffer has a byte's worth:
    if (bits >= 8) {
      bits -= 8
      out[written++] = 0xff & (buffer >> bits)
    }
  }

  // Verify that we have received just enough bits:
  if (bits >= bitsPerChar || 0xff & (buffer << (8 - bits))) {
    throw new SyntaxError('Unexpected end of data')
  }

  return out
}

/**
 * @param {Uint8Array} data
 * @param {string} alphabet
 * @param {number} bitsPerChar
 * @returns {string}
 */
const encode = (data, alphabet, bitsPerChar) => {
  const pad = alphabet[alphabet.length - 1] === '='
  const mask = (1 << bitsPerChar) - 1
  let out = ''

  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  for (let i = 0; i < data.length; ++i) {
    // Slurp data into the buffer:
    buffer = (buffer << 8) | data[i]
    bits += 8

    // Write out as much as we can:
    while (bits > bitsPerChar) {
      bits -= bitsPerChar
      out += alphabet[mask & (buffer >> bits)]
    }
  }

  // Partial character:
  if (bits) {
    out += alphabet[mask & (buffer << (bitsPerChar - bits))]
  }

  // Add padding characters until we hit a byte boundary:
  if (pad) {
    while ((out.length * bitsPerChar) & 7) {
      out += '='
    }
  }

  return out
}

/**
 * RFC4648 Factory
 *
 * @template {string} Base
 * @template {string} Prefix
 * @param {Object} options
 * @param {Base} options.name
 * @param {Prefix} options.prefix
 * @param {string} options.alphabet
 * @param {number} options.bitsPerChar
 */
export const rfc4648 = ({ name, prefix, bitsPerChar, alphabet }) => {
  return from({
    prefix,
    name,
    encode (input) {
      return encode(input, alphabet, bitsPerChar)
    },
    decode (input) {
      return decode(input, alphabet, bitsPerChar, name)
    }
  })
}
