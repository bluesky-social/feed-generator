export type Token = import('./token.js').Token;
export type DecodeOptions = import('../interface').DecodeOptions;
export type DecodeTokenizer = import('../interface').DecodeTokenizer;
/**
 * @implements {DecodeTokenizer}
 */
export class Tokeniser implements DecodeTokenizer {
    /**
     * @param {Uint8Array} data
     * @param {DecodeOptions} options
     */
    constructor(data: Uint8Array, options?: DecodeOptions);
    pos: number;
    data: Uint8Array;
    options: import("../interface").DecodeOptions;
    done(): boolean;
    next(): import("./token.js").Token;
}
/**
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
export function tokensToObject(tokeniser: DecodeTokenizer, options: DecodeOptions): any | typeof BREAK | typeof DONE;
/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {any}
 */
export function decode(data: Uint8Array, options?: import("../interface").DecodeOptions | undefined): any;
declare const BREAK: unique symbol;
declare const DONE: unique symbol;
export {};
//# sourceMappingURL=decode.d.ts.map