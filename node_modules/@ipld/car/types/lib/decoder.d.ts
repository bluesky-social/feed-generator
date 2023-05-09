/**
 * @param {BytesReader} reader
 * @returns {Promise<CarHeader>}
 */
export function readHeader(reader: BytesReader): Promise<CarHeader>;
/**
 * @param {BytesReader} reader
 * @returns {Promise<BlockHeader>}
 */
export function readBlockHead(reader: BytesReader): Promise<BlockHeader>;
/**
 * @param {BytesReader} reader
 * @returns {CarDecoder}
 */
export function createDecoder(reader: BytesReader): CarDecoder;
/**
 * @param {Uint8Array} bytes
 * @returns {BytesReader}
 */
export function bytesReader(bytes: Uint8Array): BytesReader;
/**
 * @ignore
 * reusable reader for streams and files, we just need a way to read an
 * additional chunk (of some undetermined size) and a way to close the
 * reader when finished
 * @param {() => Promise<Uint8Array|null>} readChunk
 * @returns {BytesReader}
 */
export function chunkReader(readChunk: () => Promise<Uint8Array | null>): BytesReader;
/**
 * @param {AsyncIterable<Uint8Array>} asyncIterable
 * @returns {BytesReader}
 */
export function asyncIterableReader(asyncIterable: AsyncIterable<Uint8Array>): BytesReader;
export type Block = import('../api').Block;
export type BlockHeader = import('../api').BlockHeader;
export type BlockIndex = import('../api').BlockIndex;
export type BytesReader = import('./coding').BytesReader;
export type CarHeader = import('./coding').CarHeader;
export type CarDecoder = import('./coding').CarDecoder;
//# sourceMappingURL=decoder.d.ts.map