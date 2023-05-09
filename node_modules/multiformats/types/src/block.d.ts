export type RequiredCreateOptions = {
    cid: CID;
};
export type ByteView<T> = import('./codecs/interface').ByteView<T>;
export type BlockEncoder<Code extends number, T> = import('./codecs/interface').BlockEncoder<Code, T>;
export type BlockDecoder<Code extends number, T> = import('./codecs/interface').BlockDecoder<Code, T>;
export type Hasher<Algorithm_1> = import('./hashes/interface').MultihashHasher;
/**
 * @template T
 * @template {number} Code
 * @template {number} Algorithm
 * @param {Object} options
 * @param {T} options.value
 * @param {BlockEncoder<Code, T>} options.codec
 * @param {Hasher<Algorithm>} options.hasher
 * @returns {Promise<Block<T>>}
 */
export function encode<T, Code extends number, Algorithm_1 extends number>({ value, codec, hasher }: {
    value: T;
    codec: import("./codecs/interface").BlockEncoder<Code, T>;
    hasher: import("./hashes/interface").MultihashHasher<number>;
}): Promise<Block<T>>;
/**
 * @template T
 * @template {number} Code
 * @template {number} Algorithm
 * @param {Object} options
 * @param {ByteView<T>} options.bytes
 * @param {BlockDecoder<Code, T>} options.codec
 * @param {Hasher<Algorithm>} options.hasher
 * @returns {Promise<Block<T>>}
 */
export function decode<T, Code extends number, Algorithm_1 extends number>({ bytes, codec, hasher }: {
    bytes: ByteView<T>;
    codec: import("./codecs/interface").BlockDecoder<Code, T>;
    hasher: import("./hashes/interface").MultihashHasher<number>;
}): Promise<Block<T>>;
/**
 * @template T
 * @template {number} Code
 * @template {number} Algorithm
 * @param {Object} options
 * @param {CID} options.cid
 * @param {ByteView<T>} options.bytes
 * @param {BlockDecoder<Code, T>} options.codec
 * @param {Hasher<Algorithm>} options.hasher
 * @returns {Promise<Block<T>>}
 */
export function create<T, Code extends number, Algorithm_1 extends number>({ bytes, cid, hasher, codec }: {
    cid: CID;
    bytes: ByteView<T>;
    codec: import("./codecs/interface").BlockDecoder<Code, T>;
    hasher: import("./hashes/interface").MultihashHasher<number>;
}): Promise<Block<T>>;
/**
 * @typedef {Object} RequiredCreateOptions
 * @property {CID} options.cid
 */
/**
 * @template T
 * @template {number} Code
 * @param {{ cid: CID, value:T, codec?: BlockDecoder<Code, T>, bytes: ByteView<T> }|{cid:CID, bytes:ByteView<T>, value?:void, codec:BlockDecoder<Code, T>}} options
 * @returns {Block<T>}
 */
export function createUnsafe<T, Code extends number>({ bytes, cid, value, codec }: {
    cid: CID;
    value: T;
    codec?: import("./codecs/interface").BlockDecoder<Code, T> | undefined;
    bytes: ByteView<T>;
} | {
    cid: CID;
    bytes: ByteView<T>;
    value?: void | undefined;
    codec: import("./codecs/interface").BlockDecoder<Code, T>;
}): Block<T>;
/**
 * @template T
 */
export class Block<T> {
    /**
     * @param {Object} options
     * @param {CID} options.cid
     * @param {ByteView<T>} options.bytes
     * @param {T} options.value
     */
    constructor({ cid, bytes, value }: {
        cid: CID;
        bytes: ByteView<T>;
        value: T;
    });
    cid: CID;
    bytes: ByteView<T>;
    value: T;
    asBlock: Block<T>;
    links(): Iterable<[string, CID]>;
    tree(): Iterable<string>;
    /**
   * @param {string} [path]
   */
    get(path?: string | undefined): {
        value: CID;
        remaining: string;
    } | {
        value: Record<string, any>;
        remaining?: undefined;
    };
}
import { CID } from "./index.js";
//# sourceMappingURL=block.d.ts.map