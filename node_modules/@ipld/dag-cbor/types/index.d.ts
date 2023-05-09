export const name: "dag-cbor";
export const code: 113;
export function encode<T>(node: T): import("multiformats/codecs/interface").ByteView<T>;
export function decode<T>(data: import("multiformats/codecs/interface").ByteView<T>): T;
export type ByteView<T> = import('multiformats/codecs/interface').ByteView<T>;
//# sourceMappingURL=index.d.ts.map