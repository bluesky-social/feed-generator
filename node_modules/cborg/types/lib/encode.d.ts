/** @returns {TokenTypeEncoder[]} */
export function makeCborEncoders(): TokenTypeEncoder[];
export type EncodeOptions = import('../interface').EncodeOptions;
export type OptionalTypeEncoder = import('../interface').OptionalTypeEncoder;
export type Reference = import('../interface').Reference;
export type StrictTypeEncoder = import('../interface').StrictTypeEncoder;
export type TokenTypeEncoder = import('../interface').TokenTypeEncoder;
export type TokenOrNestedTokens = import('../interface').TokenOrNestedTokens;
/**
 * @param {any} obj
 * @param {EncodeOptions} [options]
 * @param {Reference} [refStack]
 * @returns {TokenOrNestedTokens}
 */
export function objectToTokens(obj: any, options?: import("../interface").EncodeOptions | undefined, refStack?: import("../interface").Reference | undefined): TokenOrNestedTokens;
/**
 * @param {any} data
 * @param {EncodeOptions} [options]
 * @returns {Uint8Array}
 */
export function encode(data: any, options?: import("../interface").EncodeOptions | undefined): Uint8Array;
/**
 * @param {any} data
 * @param {TokenTypeEncoder[]} encoders
 * @param {EncodeOptions} options
 * @returns {Uint8Array}
 */
export function encodeCustom(data: any, encoders: TokenTypeEncoder[], options: EncodeOptions): Uint8Array;
/** @implements {Reference} */
export class Ref implements Reference {
    /**
     * @param {Reference|undefined} stack
     * @param {object|any[]} obj
     * @returns {Reference}
     */
    static createCheck(stack: Reference | undefined, obj: object | any[]): Reference;
    /**
     * @param {object|any[]} obj
     * @param {Reference|undefined} parent
     */
    constructor(obj: object | any[], parent: Reference | undefined);
    obj: object | any[];
    parent: import("../interface").Reference | undefined;
    /**
     * @param {object|any[]} obj
     * @returns {boolean}
     */
    includes(obj: object | any[]): boolean;
}
//# sourceMappingURL=encode.d.ts.map