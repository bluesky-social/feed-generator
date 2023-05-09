import { makeCborEncoders, objectToTokens } from './encode.js'
import { quickEncodeToken } from './jump.js'

/**
 * @typedef {import('../interface').EncodeOptions} EncodeOptions
 * @typedef {import('../interface').TokenTypeEncoder} TokenTypeEncoder
 * @typedef {import('../interface').TokenOrNestedTokens} TokenOrNestedTokens
 */

const cborEncoders = makeCborEncoders()

/** @type {EncodeOptions} */
const defaultEncodeOptions = {
  float64: false,
  quickEncodeToken
}

/**
 * Calculate the byte length of the given data when encoded as CBOR with the
 * options provided.
 * This calculation will be accurate if the same options are used as when
 * performing a normal encode. Some encode options can change the encoding
 * output length.
 *
 * @param {any} data
 * @param {EncodeOptions} [options]
 * @returns {number}
 */
export function encodedLength (data, options) {
  options = Object.assign({}, defaultEncodeOptions, options)
  options.mapSorter = undefined // won't change the length
  const tokens = objectToTokens(data, options)
  return tokensToLength(tokens, cborEncoders, options)
}

/**
 * Calculate the byte length of the data as represented by the given tokens when
 * encoded as CBOR with the options provided.
 * This function is for advanced users and would not normally be called
 * directly. See `encodedLength()` for appropriate use.
 *
 * @param {TokenOrNestedTokens} tokens
 * @param {TokenTypeEncoder[]} [encoders]
 * @param {EncodeOptions} [options]
 */
export function tokensToLength (tokens, encoders = cborEncoders, options = defaultEncodeOptions) {
  if (Array.isArray(tokens)) {
    let len = 0
    for (const token of tokens) {
      len += tokensToLength(token, encoders, options)
    }
    return len
  } else {
    const encoder = encoders[tokens.type.major]
    /* c8 ignore next 3 */
    if (encoder.encodedSize === undefined || typeof encoder.encodedSize !== 'function') {
      throw new Error(`Encoder for ${tokens.type.name} does not have an encodedSize()`)
    }
    return encoder.encodedSize(tokens, options)
  }
}
