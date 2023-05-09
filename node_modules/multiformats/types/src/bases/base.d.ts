export function or<L extends string, R extends string>(left: import("./interface").UnibaseDecoder<L> | import("./interface").CombobaseDecoder<L>, right: import("./interface").UnibaseDecoder<R> | import("./interface").CombobaseDecoder<R>): ComposedDecoder<L | R>;
/**
 * @template T
 * @typedef {import('./interface').MultibaseCodec<T>} MultibaseCodec
 */
/**
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseCodec<Prefix>}
 * @implements {MultibaseEncoder<Prefix>}
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {BaseCodec}
 * @implements {BaseEncoder}
 * @implements {BaseDecoder}
 */
export class Codec<Base extends string, Prefix extends string> implements MultibaseCodec<Prefix>, MultibaseEncoder<Prefix>, MultibaseDecoder<Prefix>, BaseCodec, BaseEncoder, BaseDecoder {
    /**
     * @param {Base} name
     * @param {Prefix} prefix
     * @param {(bytes:Uint8Array) => string} baseEncode
     * @param {(text:string) => Uint8Array} baseDecode
     */
    constructor(name: Base, prefix: Prefix, baseEncode: (bytes: Uint8Array) => string, baseDecode: (text: string) => Uint8Array);
    name: Base;
    prefix: Prefix;
    baseEncode: (bytes: Uint8Array) => string;
    baseDecode: (text: string) => Uint8Array;
    encoder: Encoder<Base, Prefix>;
    decoder: Decoder<Base, Prefix>;
    /**
     * @param {Uint8Array} input
     */
    encode(input: Uint8Array): Multibase<Prefix>;
    /**
     * @param {string} input
     */
    decode(input: string): Uint8Array;
}
export function from<Base extends string, Prefix extends string>({ name, prefix, encode, decode }: {
    name: Base;
    prefix: Prefix;
    encode: (bytes: Uint8Array) => string;
    decode: (input: string) => Uint8Array;
}): Codec<Base, Prefix>;
export function baseX<Base extends string, Prefix extends string>({ prefix, name, alphabet }: {
    name: Base;
    prefix: Prefix;
    alphabet: string;
}): Codec<Base, Prefix>;
export function rfc4648<Base extends string, Prefix extends string>({ name, prefix, bitsPerChar, alphabet }: {
    name: Base;
    prefix: Prefix;
    alphabet: string;
    bitsPerChar: number;
}): Codec<Base, Prefix>;
export type BaseEncoder = import('./interface').BaseEncoder;
export type BaseDecoder = import('./interface').BaseDecoder;
export type BaseCodec = import('./interface').BaseCodec;
export type Multibase<T extends string> = import('./interface').Multibase<T>;
export type MultibaseEncoder<T extends string> = import('./interface').MultibaseEncoder<T>;
export type MultibaseDecoder<Prefix extends string> = import('./interface').MultibaseDecoder<Prefix>;
export type UnibaseDecoder<Prefix extends string> = import('./interface').UnibaseDecoder<Prefix>;
export type CombobaseDecoder<Prefix extends string> = import('./interface').CombobaseDecoder<Prefix>;
export type Decoders<Prefix extends string> = Record<Prefix, UnibaseDecoder<Prefix>>;
export type MultibaseCodec<T> = import('./interface').MultibaseCodec<T>;
/**
 * @template {string} Prefix
 * @typedef {import('./interface').CombobaseDecoder<Prefix>} CombobaseDecoder
 */
/**
 * @template {string} Prefix
 * @typedef {Record<Prefix, UnibaseDecoder<Prefix>>} Decoders
 */
/**
 * @template {string} Prefix
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {CombobaseDecoder<Prefix>}
 */
declare class ComposedDecoder<Prefix extends string> implements MultibaseDecoder<Prefix>, CombobaseDecoder<Prefix> {
    /**
     * @param {Record<Prefix, UnibaseDecoder<Prefix>>} decoders
     */
    constructor(decoders: Record<Prefix, UnibaseDecoder<Prefix>>);
    decoders: Record<Prefix, import("./interface").UnibaseDecoder<Prefix>>;
    /**
     * @template {string} OtherPrefix
     * @param {UnibaseDecoder<OtherPrefix>|ComposedDecoder<OtherPrefix>} decoder
     * @returns {ComposedDecoder<Prefix|OtherPrefix>}
     */
    or<OtherPrefix extends string>(decoder: import("./interface").UnibaseDecoder<OtherPrefix> | ComposedDecoder<OtherPrefix>): ComposedDecoder<Prefix | OtherPrefix>;
    /**
     * @param {string} input
     * @returns {Uint8Array}
     */
    decode(input: string): Uint8Array;
}
/**
 * @typedef {import('./interface').BaseEncoder} BaseEncoder
 * @typedef {import('./interface').BaseDecoder} BaseDecoder
 * @typedef {import('./interface').BaseCodec} BaseCodec
 */
/**
 * @template {string} T
 * @typedef {import('./interface').Multibase<T>} Multibase
 */
/**
 * @template {string} T
 * @typedef {import('./interface').MultibaseEncoder<T>} MultibaseEncoder
 */
/**
 * Class represents both BaseEncoder and MultibaseEncoder meaning it
 * can be used to encode to multibase or base encode without multibase
 * prefix.
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseEncoder<Prefix>}
 * @implements {BaseEncoder}
 */
declare class Encoder<Base extends string, Prefix extends string> implements MultibaseEncoder<Prefix>, BaseEncoder {
    /**
     * @param {Base} name
     * @param {Prefix} prefix
     * @param {(bytes:Uint8Array) => string} baseEncode
     */
    constructor(name: Base, prefix: Prefix, baseEncode: (bytes: Uint8Array) => string);
    name: Base;
    prefix: Prefix;
    baseEncode: (bytes: Uint8Array) => string;
    /**
     * @param {Uint8Array} bytes
     * @returns {Multibase<Prefix>}
     */
    encode(bytes: Uint8Array): Multibase<Prefix>;
}
/**
 * @template {string} Prefix
 * @typedef {import('./interface').MultibaseDecoder<Prefix>} MultibaseDecoder
 */
/**
 * @template {string} Prefix
 * @typedef {import('./interface').UnibaseDecoder<Prefix>} UnibaseDecoder
 */
/**
 * @template {string} Prefix
 */
/**
 * Class represents both BaseDecoder and MultibaseDecoder so it could be used
 * to decode multibases (with matching prefix) or just base decode strings
 * with corresponding base encoding.
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {UnibaseDecoder<Prefix>}
 * @implements {BaseDecoder}
 */
declare class Decoder<Base extends string, Prefix extends string> implements MultibaseDecoder<Prefix>, UnibaseDecoder<Prefix>, BaseDecoder {
    /**
     * @param {Base} name
     * @param {Prefix} prefix
     * @param {(text:string) => Uint8Array} baseDecode
     */
    constructor(name: Base, prefix: Prefix, baseDecode: (text: string) => Uint8Array);
    name: Base;
    prefix: Prefix;
    /** @private */
    private prefixCodePoint;
    baseDecode: (text: string) => Uint8Array;
    /**
     * @param {string} text
     */
    decode(text: string): Uint8Array;
    /**
     * @template {string} OtherPrefix
     * @param {UnibaseDecoder<OtherPrefix>|ComposedDecoder<OtherPrefix>} decoder
     * @returns {ComposedDecoder<Prefix|OtherPrefix>}
     */
    or<OtherPrefix extends string>(decoder: import("./interface").UnibaseDecoder<OtherPrefix> | ComposedDecoder<OtherPrefix>): ComposedDecoder<Prefix | OtherPrefix>;
}
export {};
//# sourceMappingURL=base.d.ts.map