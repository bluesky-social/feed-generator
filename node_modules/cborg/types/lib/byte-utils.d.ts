/**
 * @param {Uint8Array|number[]} buf
 * @returns {Uint8Array}
 */
export function asU8A(buf: Uint8Array | number[]): Uint8Array;
/**
 * @param {Uint8Array} b1
 * @param {Uint8Array} b2
 * @returns {number}
 */
export function compare(b1: Uint8Array, b2: Uint8Array): number;
/**
 * @param {number[]} codePoints
 * @returns {string}
 */
export function decodeCodePointsArray(codePoints: number[]): string;
export const useBuffer: boolean;
/**
 * @param {Uint8Array} bytes
 * @param {number} start
 * @param {number} end
 */
export function toString(bytes: Uint8Array, start: number, end: number): string;
export const fromString: ((string: string) => number[] | Buffer) | ((string: string) => Uint8Array | number[]);
export function fromArray(arr: number[]): Uint8Array;
/**
 * @param {Uint8Array} bytes
 * @param {number} start
 * @param {number} end
 */
export function slice(bytes: Uint8Array, start: number, end: number): Uint8Array;
/**
 * @param {Uint8Array[]} chunks
 * @param {number} length
 * @returns {Uint8Array}
 */
export function concat(chunks: Uint8Array[], length: number): Uint8Array;
/**
 * @param {number} size
 * @returns {Uint8Array}
 */
export function alloc(size: number): Uint8Array;
/**
 * @param {Uint8Array} d
 * @returns {string}
 */
export function toHex(d: Uint8Array): string;
/**
 * @param {string|Uint8Array} hex
 * @returns {Uint8Array}
 */
export function fromHex(hex: string | Uint8Array): Uint8Array;
//# sourceMappingURL=byte-utils.d.ts.map