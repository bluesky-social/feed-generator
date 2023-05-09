/**
 * @typedef {import('multiformats').CID} CID
 * @typedef {import('../api').Block} Block
 * @typedef {import('./coding').CarEncoder} CarEncoder
 * @typedef {import('./coding').IteratorChannel_Writer<Uint8Array>} IteratorChannel_Writer
 */
/**
 * Create a header from an array of roots.
 *
 * @param {CID[]} roots
 * @returns {Uint8Array}
 */
export function createHeader(roots: CID[]): Uint8Array;
export type CID = import('multiformats').CID;
export type Block = import('../api').Block;
export type CarEncoder = import('./coding').CarEncoder;
export type IteratorChannel_Writer = import('./coding').IteratorChannel_Writer<Uint8Array>;
/**
 * @param {IteratorChannel_Writer} writer
 * @returns {CarEncoder}
 */
export function createEncoder(writer: import("./coding").IteratorChannel_Writer<Uint8Array>): CarEncoder;
//# sourceMappingURL=encoder.d.ts.map