/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeUndefined(_data: Uint8Array, _pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeBreak(_data: Uint8Array, _pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeFloat16(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeFloat32(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeFloat64(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Bl} buf
 * @param {Token} token
 * @param {EncodeOptions} options
 */
export function encodeFloat(buf: Bl, token: Token, options: EncodeOptions): void;
export namespace encodeFloat {
    /**
     * @param {Token} token
     * @param {EncodeOptions} options
     * @returns {number}
     */
    function encodedSize(token: Token, options: import("../interface").EncodeOptions): number;
    const compareTokens: (tok1: Token, tok2: Token) => number;
}
export type Bl = import('./bl.js').Bl;
export type DecodeOptions = import('../interface').DecodeOptions;
export type EncodeOptions = import('../interface').EncodeOptions;
import { Token } from './token.js';
//# sourceMappingURL=7float.d.ts.map