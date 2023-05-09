export type Block = import('../api').Block;
export type PBNode = import('@ipld/dag-pb').PBNode;
/**
 * @param {any} object
 * @param {{code: number, encode: (obj: any) => Uint8Array}} codec
 * @param {import('multiformats/cid').CIDVersion} version
 * @returns {Promise<TestBlock & { object: any }>}
 */
export function toBlock(object: any, codec: {
    code: number;
    encode: (obj: any) => Uint8Array;
}, version?: import('multiformats/cid').CIDVersion): Promise<TestBlock & {
    object: any;
}>;
export const assert: Chai.AssertStatic;
export function makeData(): Promise<{
    rawBlocks: TestBlock[];
    pbBlocks: TestBlock[];
    cborBlocks: TestBlock[];
    allBlocks: [string, TestBlock[]][];
    allBlocksFlattened: TestBlock[];
}>;
/**
 * @param {Uint8Array} data
 * @param {number} chunkSize
 * @returns {AsyncIterable<Uint8Array>}
 */
export function makeIterable(data: Uint8Array, chunkSize: number): AsyncIterable<Uint8Array>;
export const rndCid: CID;
export const carBytes: Uint8Array;
export const goCarBytes: Uint8Array;
export const goCarRoots: CID[];
export const goCarIndex: {
    cid: CID;
    offset: number;
    length: number;
    blockOffset: number;
    blockLength: number;
}[];
/**
 * @typedef {import('../api').Block} Block
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */
/**
 * @extends {Block}
 */
declare class TestBlock {
    /**
     * @param {Uint8Array} bytes
     * @param {CID} cid
     * @param {any} object
     */
    constructor(bytes: Uint8Array, cid: CID, object: any);
    bytes: Uint8Array;
    cid: CID;
    object: any;
}
import { CID } from "multiformats";
export {};
//# sourceMappingURL=common.d.ts.map