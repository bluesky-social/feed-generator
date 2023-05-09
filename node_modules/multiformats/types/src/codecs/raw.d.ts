/**
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */
export const name: "raw";
export const code: 85;
export function encode(node: Uint8Array): ByteView<Uint8Array>;
export function decode(data: ByteView<Uint8Array>): Uint8Array;
export type ByteView<T> = import('./interface').ByteView<T>;
//# sourceMappingURL=raw.d.ts.map