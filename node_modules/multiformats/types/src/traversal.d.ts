export type CID = import('./cid.js').CID;
export type Block<T> = import('./block.js').Block<T>;
/**
 * @typedef {import('./cid.js').CID} CID
 */
/**
 * @template T
 * @typedef {import('./block.js').Block<T>} Block
 */
/**
 * @template T
 * @param {Object} options
 * @param {CID} options.cid
 * @param {(cid: CID) => Promise<Block<T>|null>} options.load
 * @param {Set<string>} [options.seen]
 */
export function walk<T>({ cid, load, seen }: {
    cid: CID;
    load: (cid: CID) => Promise<import("./block.js").Block<T> | null>;
    seen?: Set<string> | undefined;
}): Promise<void>;
//# sourceMappingURL=traversal.d.ts.map