/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */
/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
export function readUint8(data: Uint8Array, offset: number, options: DecodeOptions): number;
/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
export function readUint16(data: Uint8Array, offset: number, options: DecodeOptions): number;
/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
export function readUint32(data: Uint8Array, offset: number, options: DecodeOptions): number;
/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number|bigint}
 */
export function readUint64(data: Uint8Array, offset: number, options: DecodeOptions): number | bigint;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeUint8(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeUint16(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeUint32(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
export function decodeUint64(data: Uint8Array, pos: number, _minor: number, options: DecodeOptions): Token;
/**
 * @param {Bl} buf
 * @param {Token} token
 */
export function encodeUint(buf: Bl, token: Token): void;
export namespace encodeUint {
    /**
     * @param {Token} token
     * @returns {number}
     */
    function encodedSize(token: Token): number;
    /**
     * @param {Token} tok1
     * @param {Token} tok2
     * @returns {number}
     */
    function compareTokens(tok1: Token, tok2: Token): number;
}
/**
 * @param {Bl} buf
 * @param {number} major
 * @param {number|bigint} uint
 */
export function encodeUintValue(buf: Bl, major: number, uint: number | bigint): void;
export namespace encodeUintValue {
    /**
     * @param {number} uint
     * @returns {number}
     */
    function encodedSize(uint: number): number;
}
export const uintBoundaries: (number | bigint)[];
export type Bl = import('./bl.js').Bl;
export type DecodeOptions = import('../interface').DecodeOptions;
import { Token } from './token.js';
//# sourceMappingURL=0uint.d.ts.map