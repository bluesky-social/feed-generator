import { CID } from 'multiformats/cid';
export declare type Block = {
    cid: CID;
    bytes: Uint8Array;
};
export declare type BlockHeader = {
    cid: CID;
    length: number;
    blockLength: number;
};
export declare type BlockIndex = BlockHeader & {
    offset: number;
    blockOffset: number;
};
export interface RootsReader {
    version: number;
    getRoots(): Promise<CID[]>;
}
export interface BlockIterator extends AsyncIterable<Block> {
}
export interface CIDIterator extends AsyncIterable<CID> {
}
export interface BlockReader {
    has(key: CID): Promise<boolean>;
    get(key: CID): Promise<Block | undefined>;
    blocks(): BlockIterator;
    cids(): CIDIterator;
}
export interface BlockWriter {
    put(block: Block): Promise<void>;
    close(): Promise<void>;
}
export interface WriterChannel {
    writer: BlockWriter;
    out: AsyncIterable<Uint8Array>;
}
export interface CarReader extends BlockReader, RootsReader {
}
//# sourceMappingURL=api.d.ts.map