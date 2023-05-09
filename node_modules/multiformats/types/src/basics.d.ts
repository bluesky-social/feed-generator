import { CID } from "./index.js";
import { hasher } from "./index.js";
import { digest } from "./index.js";
import { varint } from "./index.js";
import { bytes } from "./index.js";
export const hashes: {
    identity: {
        code: number;
        name: string;
        encode: (input: Uint8Array) => Uint8Array;
        digest: (input: Uint8Array) => digest.Digest<0, number>;
    };
    sha256: hasher.Hasher<"sha2-256", 18>;
    sha512: hasher.Hasher<"sha2-512", 19>;
};
export const bases: {
    base256emoji: import("./bases/base.js").Codec<"base256emoji", "🚀">;
    base64: import("./bases/base.js").Codec<"base64", "m">;
    base64pad: import("./bases/base.js").Codec<"base64pad", "M">;
    base64url: import("./bases/base.js").Codec<"base64url", "u">;
    base64urlpad: import("./bases/base.js").Codec<"base64urlpad", "U">;
    base58btc: import("./bases/base.js").Codec<"base58btc", "z">;
    base58flickr: import("./bases/base.js").Codec<"base58flickr", "Z">;
    base36: import("./bases/base.js").Codec<"base36", "k">;
    base36upper: import("./bases/base.js").Codec<"base36upper", "K">;
    base32: import("./bases/base.js").Codec<"base32", "b">;
    base32upper: import("./bases/base.js").Codec<"base32upper", "B">;
    base32pad: import("./bases/base.js").Codec<"base32pad", "c">;
    base32padupper: import("./bases/base.js").Codec<"base32padupper", "C">;
    base32hex: import("./bases/base.js").Codec<"base32hex", "v">;
    base32hexupper: import("./bases/base.js").Codec<"base32hexupper", "V">;
    base32hexpad: import("./bases/base.js").Codec<"base32hexpad", "t">;
    base32hexpadupper: import("./bases/base.js").Codec<"base32hexpadupper", "T">;
    base32z: import("./bases/base.js").Codec<"base32z", "h">;
    base16: import("./bases/base.js").Codec<"base16", "f">;
    base16upper: import("./bases/base.js").Codec<"base16upper", "F">;
    base10: import("./bases/base.js").Codec<"base10", "9">;
    base8: import("./bases/base.js").Codec<"base8", "7">;
    base2: import("./bases/base.js").Codec<"base2", "0">;
    identity: import("./bases/base.js").Codec<"identity", "\0">;
};
export namespace codecs {
    export { raw };
    export { json };
}
import * as raw from "./codecs/raw.js";
import * as json from "./codecs/json.js";
export { CID, hasher, digest, varint, bytes };
//# sourceMappingURL=basics.d.ts.map