/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
export function decodeArrayCompact(data: Uint8Array, pos: number, minor: number, _options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray8(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray16(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray32(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArray64(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeArrayIndefinite(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Bl} buf
 * @param {Token} token
 */
export function encodeArray(buf: Bl, token: Token): void;
export namespace encodeArray {
    const compareTokens: (tok1: Token, tok2: Token) => number;
    /**
     * @param {Token} token
     * @returns {number}
     */
    function encodedSize(token: Token): number;
}
export type Bl = import('./bl.js').Bl;
export type DecodeOptions = import('../interface').DecodeOptions;
import { Token } from './token.js';
//# sourceMappingURL=4array.d.ts.map