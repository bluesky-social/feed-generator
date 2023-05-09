/**
 * @param {Uint8Array} inp
 * @param {number} [width]
 */
export function tokensToDiagnostic(inp: Uint8Array, width?: number | undefined): Generator<string, void, unknown>;
/**
 * Convert an input string formatted as CBOR diagnostic output into binary CBOR form.
 * @param {string} input
 * @returns {Uint8Array}
 */
export function fromDiag(input: string): Uint8Array;
//# sourceMappingURL=diagnostic.d.ts.map