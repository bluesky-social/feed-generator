import { encode } from './lib/encode.js'
import { decode } from './lib/decode.js'
import { Token, Type } from './lib/token.js'

/**
 * Export the types that were present in the original manual cborg.d.ts
 * @typedef {import('./interface').TagDecoder} TagDecoder
 * There was originally just `TypeEncoder` so don't break types by renaming or not exporting
 * @typedef {import('./interface').OptionalTypeEncoder} TypeEncoder
 * @typedef {import('./interface').DecodeOptions} DecodeOptions
 * @typedef {import('./interface').EncodeOptions} EncodeOptions
 */

export {
  decode,
  encode,
  Token,
  Type
}
