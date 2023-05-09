export const name: "json";
export const code: 512;
export function encode<T>(node: T): ByteView<T>;
export function decode<T>(data: ByteView<T>): T;
export type ByteView<T> = import('./interface').ByteView<T>;
//# sourceMappingURL=json.d.ts.map