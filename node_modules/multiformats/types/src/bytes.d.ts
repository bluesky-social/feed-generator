/**
 * @param {Uint8Array} aa
 * @param {Uint8Array} bb
 */
export function equals(aa: Uint8Array, bb: Uint8Array): boolean;
/**
 * @param {ArrayBufferView|ArrayBuffer|Uint8Array} o
 * @returns {Uint8Array}
 */
export function coerce(o: ArrayBufferView | ArrayBuffer | Uint8Array): Uint8Array;
/**
 * @param {any} o
 * @returns {o is ArrayBuffer|ArrayBufferView}
 */
export function isBinary(o: any): o is ArrayBufferView | ArrayBuffer;
/**
 * @param {string} hex
 */
export function fromHex(hex: string): Uint8Array;
/**
 * @param {Uint8Array} d
 */
export function toHex(d: Uint8Array): string;
/**
 * @param {string} str
 * @returns {Uint8Array}
 */
export function fromString(str: string): Uint8Array;
/**
 * @param {Uint8Array} b
 * @returns {string}
 */
export function toString(b: Uint8Array): string;
export const empty: Uint8Array;
//# sourceMappingURL=bytes.d.ts.map