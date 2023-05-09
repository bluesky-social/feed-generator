export default BASES;
export type MultibaseCodec = import('multiformats/bases/interface').MultibaseCodec<any>;
export type SupportedEncodings = 'utf8' | 'utf-8' | 'hex' | 'latin1' | 'ascii' | 'binary' | keyof {
    base64: import("multiformats/bases/base").Codec<string, string>;
    base64pad: import("multiformats/bases/base").Codec<string, string>;
    base64url: import("multiformats/bases/base").Codec<string, string>;
    base64urlpad: import("multiformats/bases/base").Codec<string, string>;
    base58btc: import("multiformats/bases/base").Codec<"base58btc", "z">;
    base58flickr: import("multiformats/bases/base").Codec<"base58flickr", "Z">;
    base36: import("multiformats/bases/base").Codec<"base36", "k">;
    base36upper: import("multiformats/bases/base").Codec<"base36upper", "K">;
    base32: import("multiformats/bases/base").Codec<string, string>;
    base32upper: import("multiformats/bases/base").Codec<string, string>;
    base32pad: import("multiformats/bases/base").Codec<string, string>;
    base32padupper: import("multiformats/bases/base").Codec<string, string>;
    base32hex: import("multiformats/bases/base").Codec<string, string>;
    base32hexupper: import("multiformats/bases/base").Codec<string, string>;
    base32hexpad: import("multiformats/bases/base").Codec<string, string>;
    base32hexpadupper: import("multiformats/bases/base").Codec<string, string>;
    base32z: import("multiformats/bases/base").Codec<string, string>;
    base16: import("multiformats/bases/base").Codec<string, string>;
    base16upper: import("multiformats/bases/base").Codec<string, string>;
    base10: import("multiformats/bases/base").Codec<"base10", "9">;
    base8: import("multiformats/bases/base").Codec<string, string>;
    base2: import("multiformats/bases/base").Codec<string, string>;
    identity: import("multiformats/bases/base").Codec<"identity", "\0">;
};
/**
 * @typedef {'utf8' | 'utf-8' | 'hex' | 'latin1' | 'ascii' | 'binary' | keyof bases } SupportedEncodings
 */
/**
 * @type {Record<SupportedEncodings, MultibaseCodec>}
 */
declare const BASES: Record<SupportedEncodings, import("multiformats/bases/interface").MultibaseCodec<any>>;
//# sourceMappingURL=bases.d.ts.map