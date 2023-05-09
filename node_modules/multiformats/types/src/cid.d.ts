/**
 * @typedef {import('./hashes/interface').MultihashDigest} MultihashDigest
 * @typedef {0 | 1} CIDVersion
 */
/**
 * @template Prefix
 * @typedef {import('./bases/interface').MultibaseEncoder<Prefix>} MultibaseEncoder
 */
/**
 * @template Prefix
 * @typedef {import('./bases/interface').MultibaseDecoder<Prefix>} MultibaseDecoder
 */
export class CID {
    /**
     * @param {any} value
     * @returns {value is CID}
     */
    static isCID(value: any): value is CID;
    /**
     * Takes any input `value` and returns a `CID` instance if it was
     * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
     * it will return value back. If `value` is not instance of this CID
     * class, but is compatible CID it will return new instance of this
     * `CID` class. Otherwise returs null.
     *
     * This allows two different incompatible versions of CID library to
     * co-exist and interop as long as binary interface is compatible.
     * @param {any} value
     * @returns {CID|null}
     */
    static asCID(value: any): CID | null;
    /**
   *
   * @param {CIDVersion} version - Version of the CID
   * @param {number} code - Code of the codec content is encoded in.
   * @param {MultihashDigest} digest - (Multi)hash of the of the content.
   * @returns {CID}
   */
    static create(version: CIDVersion, code: number, digest: MultihashDigest): CID;
    /**
     * Simplified version of `create` for CIDv0.
     * @param {MultihashDigest} digest - Multihash.
     */
    static createV0(digest: MultihashDigest): CID;
    /**
   * Simplified version of `create` for CIDv1.
   * @template {number} Code
   * @param {Code} code - Content encoding format code.
   * @param {MultihashDigest} digest - Miltihash of the content.
   * @returns {CID}
   */
    static createV1<Code extends number>(code: Code, digest: MultihashDigest): CID;
    /**
     * Decoded a CID from its binary representation. The byte array must contain
     * only the CID with no additional bytes.
     *
     * An error will be thrown if the bytes provided do not contain a valid
     * binary representation of a CID.
     *
     * @param {Uint8Array} bytes
     * @returns {CID}
     */
    static decode(bytes: Uint8Array): CID;
    /**
     * Decoded a CID from its binary representation at the beginning of a byte
     * array.
     *
     * Returns an array with the first element containing the CID and the second
     * element containing the remainder of the original byte array. The remainder
     * will be a zero-length byte array if the provided bytes only contained a
     * binary CID representation.
     *
     * @param {Uint8Array} bytes
     * @returns {[CID, Uint8Array]}
     */
    static decodeFirst(bytes: Uint8Array): [CID, Uint8Array];
    /**
     * Inspect the initial bytes of a CID to determine its properties.
     *
     * Involves decoding up to 4 varints. Typically this will require only 4 to 6
     * bytes but for larger multicodec code values and larger multihash digest
     * lengths these varints can be quite large. It is recommended that at least
     * 10 bytes be made available in the `initialBytes` argument for a complete
     * inspection.
     *
     * @param {Uint8Array} initialBytes
     * @returns {{ version:CIDVersion, codec:number, multihashCode:number, digestSize:number, multihashSize:number, size:number }}
     */
    static inspectBytes(initialBytes: Uint8Array): {
        version: CIDVersion;
        codec: number;
        multihashCode: number;
        digestSize: number;
        multihashSize: number;
        size: number;
    };
    /**
     * Takes cid in a string representation and creates an instance. If `base`
     * decoder is not provided will use a default from the configuration. It will
     * throw an error if encoding of the CID is not compatible with supplied (or
     * a default decoder).
     *
     * @template {string} Prefix
     * @param {string} source
     * @param {MultibaseDecoder<Prefix>} [base]
     */
    static parse<Prefix extends string>(source: string, base?: import("./bases/interface").MultibaseDecoder<Prefix> | undefined): CID;
    /**
     * @param {CIDVersion} version
     * @param {number} code - multicodec code, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param {MultihashDigest} multihash
     * @param {Uint8Array} bytes
     *
     */
    constructor(version: CIDVersion, code: number, multihash: MultihashDigest, bytes: Uint8Array);
    code: number;
    version: CIDVersion;
    multihash: import("./hashes/interface").MultihashDigest<number>;
    bytes: Uint8Array;
    byteOffset: number;
    byteLength: number;
    /** @private */
    private asCID;
    /**
     * @type {Map<string, string>}
     * @private
     */
    private _baseCache;
    /**
     * @returns {CID}
     */
    toV0(): CID;
    /**
     * @returns {CID}
     */
    toV1(): CID;
    /**
     * @param {any} other
     */
    equals(other: any): any;
    /**
     * @param {MultibaseEncoder<any>} [base]
     * @returns {string}
     */
    toString(base?: import("./bases/interface").MultibaseEncoder<any> | undefined): string;
    toJSON(): {
        code: number;
        version: CIDVersion;
        hash: Uint8Array;
    };
    get toBaseEncodedString(): void;
    get codec(): void;
    get buffer(): void;
    get multibaseName(): void;
    get prefix(): void;
    get [Symbol.toStringTag](): string;
}
export type MultihashDigest = import('./hashes/interface').MultihashDigest;
export type CIDVersion = 0 | 1;
export type MultibaseEncoder<Prefix> = import('./bases/interface').MultibaseEncoder<Prefix>;
export type MultibaseDecoder<Prefix> = import('./bases/interface').MultibaseDecoder<Prefix>;
//# sourceMappingURL=cid.d.ts.map