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
export function encodedLength(data: any, options?: import("../interface").EncodeOptions | undefined): number;
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
export function tokensToLength(tokens: TokenOrNestedTokens, encoders?: import("../interface").TokenTypeEncoder[] | undefined, options?: import("../interface").EncodeOptions | undefined): number;
export type EncodeOptions = import('../interface').EncodeOptions;
export type TokenTypeEncoder = import('../interface').TokenTypeEncoder;
export type TokenOrNestedTokens = import('../interface').TokenOrNestedTokens;
//# sourceMappingURL=length.d.ts.map