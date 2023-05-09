export namespace identity {
    export { code };
    export { name };
    export { encode };
    export { digest };
}
declare const code: 0;
declare const name: "identity";
/** @type {(input:Uint8Array) => Uint8Array} */
declare const encode: (input: Uint8Array) => Uint8Array;
/**
 * @param {Uint8Array} input
 * @returns {Digest.Digest<typeof code, number>}
 */
declare function digest(input: Uint8Array): Digest.Digest<typeof code, number>;
import * as Digest from "./digest.js";
export {};
//# sourceMappingURL=identity.d.ts.map