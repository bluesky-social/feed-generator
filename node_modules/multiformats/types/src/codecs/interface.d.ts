/**
 * IPLD encoder part of the codec.
 */
export interface BlockEncoder<Code extends number, T> {
    name: string;
    code: Code;
    encode(data: T): ByteView<T>;
}
/**
 * IPLD decoder part of the codec.
 */
export interface BlockDecoder<Code extends number, T> {
    code: Code;
    decode(bytes: ByteView<T>): T;
}
/**
 * An IPLD codec is a combination of both encoder and decoder.
 */
export interface BlockCodec<Code extends number, T> extends BlockEncoder<Code, T>, BlockDecoder<Code, T> {
}
export declare type ByteView<T> = Uint8Array | Uint8Array & {
    data: T;
};
//# sourceMappingURL=interface.d.ts.map