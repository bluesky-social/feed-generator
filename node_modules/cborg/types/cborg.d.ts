/**
 * There was originally just `TypeEncoder` so don't break types by renaming or not exporting
 */
export type TagDecoder = import('./interface').TagDecoder;
/**
 * Export the types that were present in the original manual cborg.d.ts
 */
export type TypeEncoder = import('./interface').OptionalTypeEncoder;
/**
 * Export the types that were present in the original manual cborg.d.ts
 */
export type DecodeOptions = import('./interface').DecodeOptions;
/**
 * Export the types that were present in the original manual cborg.d.ts
 */
export type EncodeOptions = import('./interface').EncodeOptions;
import { decode } from './lib/decode.js';
import { encode } from './lib/encode.js';
import { Token } from './lib/token.js';
import { Type } from './lib/token.js';
export { decode, encode, Token, Type };
//# sourceMappingURL=cborg.d.ts.map