declare function base(ALPHABET: string, name: string): base.BaseConverter;
export = base;
declare namespace base {
    interface BaseConverter {
        encode(buffer: Uint8Array | number[]): string;
        decodeUnsafe(string: string): Uint8Array | undefined;
        decode(string: string): Uint8Array;
    }
}
