export function from<Name extends string, Code extends number>({ name, code, encode }: {
    name: Name;
    code: Code;
    encode: (input: Uint8Array) => Await<Uint8Array>;
}): Hasher<Name, Code>;
/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 *
 * @template {string} Name
 * @template {number} Code
 * @class
 * @implements {MultihashHasher<Code>}
 */
export class Hasher<Name extends string, Code extends number> implements MultihashHasher<Code> {
    /**
     *
     * @param {Name} name
     * @param {Code} code
     * @param {(input: Uint8Array) => Await<Uint8Array>} encode
     */
    constructor(name: Name, code: Code, encode: (input: Uint8Array) => Await<Uint8Array>);
    name: Name;
    code: Code;
    encode: (input: Uint8Array) => Await<Uint8Array>;
    /**
     * @param {Uint8Array} input
     * @returns {Await<Digest.Digest<Code, number>>}
     */
    digest(input: Uint8Array): Await<Digest.Digest<Code, number>>;
}
export type MultihashHasher<Alg extends number> = import('./interface').MultihashHasher;
export type Await<T> = Promise<T> | T;
import * as Digest from "./digest.js";
//# sourceMappingURL=hasher.d.ts.map