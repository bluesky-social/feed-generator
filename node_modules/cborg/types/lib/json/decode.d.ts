export type DecodeOptions = import('../../interface').DecodeOptions;
export type DecodeTokenizer = import('../../interface').DecodeTokenizer;
/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {any}
 */
export function decode(data: Uint8Array, options?: import("../../interface").DecodeOptions | undefined): any;
/**
 * @typedef {import('../../interface').DecodeOptions} DecodeOptions
 * @typedef {import('../../interface').DecodeTokenizer} DecodeTokenizer
 */
/**
 * @implements {DecodeTokenizer}
 */
export class Tokenizer implements DecodeTokenizer {
    /**
     * @param {Uint8Array} data
     * @param {DecodeOptions} options
     */
    constructor(data: Uint8Array, options?: DecodeOptions);
    pos: number;
    data: Uint8Array;
    options: import("../../interface").DecodeOptions;
    /** @type {string[]} */
    modeStack: string[];
    lastToken: string;
    /**
     * @returns {boolean}
     */
    done(): boolean;
    /**
     * @returns {number}
     */
    ch(): number;
    /**
     * @returns {string}
     */
    currentMode(): string;
    skipWhitespace(): void;
    /**
     * @param {number[]} str
     */
    expect(str: number[]): void;
    parseNumber(): Token;
    /**
     * @returns {Token}
     */
    parseString(): Token;
    /**
     * @returns {Token}
     */
    parseValue(): Token;
    /**
     * @returns {Token}
     */
    next(): Token;
}
import { Token } from '../token.js';
//# sourceMappingURL=decode.d.ts.map