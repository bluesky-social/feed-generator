/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */
/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
export function decodeTagCompact(_data: Uint8Array, _pos: number, minor: number, _options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag8(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag16(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag32(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeTag64(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Bl} buf
 * @param {Token} token
 */
export function encodeTag(buf: Bl, token: Token): void;
export namespace encodeTag {
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
//# sourceMappingURL=6tag.d.ts.map