export type CID = import('multiformats').CID;
export type Block = import('../api').Block;
export type RootsReader = import('../api').RootsReader;
export type BlockIterator = import('../api').BlockIterator;
export type CIDIterator = import('../api').CIDIterator;
export type BlockReader = import('../api').BlockReader;
/**
 * @param {RootsReader} reader
 */
export function verifyRoots(reader: RootsReader): Promise<void>;
/**
 * @param {BlockReader} reader
 */
export function verifyHas(reader: BlockReader): Promise<void>;
/**
 * @param {BlockReader} reader
 */
export function verifyGet(reader: BlockReader): Promise<void>;
/**
 * @param {BlockIterator} iterator
 * @param {boolean | void} unordered
 */
export function verifyBlocks(iterator: BlockIterator, unordered: boolean | void): Promise<void>;
/**
 * @param {CIDIterator} iterator
 * @param {boolean | void} unordered
 */
export function verifyCids(iterator: CIDIterator, unordered: boolean | void): Promise<void>;
//# sourceMappingURL=verify-store-reader.d.ts.map