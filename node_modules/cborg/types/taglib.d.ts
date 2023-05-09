/**
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
export function bigIntDecoder(bytes: Uint8Array): bigint;
/**
 * @param {bigint} obj
 * @returns {Token[]|null}
 */
export function bigIntEncoder(obj: bigint): Token[] | null;
/**
 * TAG(3) Negative Bignums https://tools.ietf.org/html/rfc8949#section-3.4.3
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
export function bigNegIntDecoder(bytes: Uint8Array): bigint;
import { Token } from './cborg.js';
//# sourceMappingURL=taglib.d.ts.map