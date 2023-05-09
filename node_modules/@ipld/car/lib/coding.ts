import { CID } from 'multiformats/cid'
import { Block, BlockIndex } from '../api'

export interface CarEncoder {
  setRoots(roots: CID[]): Promise<void>

  writeBlock(block: Block): Promise<void>

  close(): Promise<void>
}

export interface IteratorChannel_Writer<T> {
  write(chunk: T): Promise<void>
  end(): Promise<void>
}

export interface IteratorChannel<T> {
  writer: IteratorChannel_Writer<T>

  iterator: AsyncIterator<T>
}

export type CarHeader = { version: number, roots: CID[] }

export interface CarDecoder {
  header(): Promise<CarHeader>

  blocks(): AsyncGenerator<Block>

  blocksIndex(): AsyncGenerator<BlockIndex>
}

export interface BytesReader {
  upTo(length: number): Promise<Uint8Array>

  exactly(length: number): Promise<Uint8Array>

  seek(length: number): void

  pos: number
}
