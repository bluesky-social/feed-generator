export enum FLOAT32_OPTIONS {
	NEVER = 0,
	ALWAYS = 1,
	DECIMAL_ROUND = 3,
	DECIMAL_FIT = 4
}

export interface Options {
	alwaysUseFloat?: boolean
	useFloat32?: FLOAT32_OPTIONS
	useRecords?: boolean
	structures?: {}[]
	structuredClone?: boolean
	mapsAsObjects?: boolean
	variableMapSize?: boolean
	copyBuffers?: boolean
	bundleStrings?: boolean
	useTimestamp32?: boolean
	largeBigIntToFloat?: boolean
	encodeUndefinedAsNil?: boolean
	maxSharedStructures?: number
	maxOwnStructures?: number
	useSelfDescribedHeader?: boolean
	keyMap?: {}
	shouldShareStructure?: (keys: string[]) => boolean
	getStructures?(): {}[]
	saveStructures?(structures: {}[]): boolean | void
	onInvalidDate?: () => any
	tagUint8Array?: boolean
	pack?: boolean
}
type ClassOf<T> = new (...args: any[]) => T;
interface Extension<T, R> {
	Class: ClassOf<T>
	tag: number
	encode(value: T, encodeFn: (data: R) => Uint8Array): Buffer | Uint8Array
	decode(item: R): T
}
export class Decoder {
	constructor(options?: Options)
	decode(messagePack: Buffer | Uint8Array): any
	decodeMultiple(messagePack: Buffer | Uint8Array, forEach?: (value: any) => any): [] | void
}
export function decode(messagePack: Buffer | Uint8Array): any
export function decodeMultiple(messagePack: Buffer | Uint8Array, forEach?: (value: any) => any): [] | void
export function addExtension<T, R>(extension: Extension<T, R>): void
export function clearSource(): void
export function roundFloat32(float32Number: number): number
export let isNativeAccelerationEnabled: boolean

export class Encoder extends Decoder {
	encode(value: any): Buffer
}
export function encode(value: any): Buffer
export function encodeAsIterable(value: any): Iterable<Buffer | Blob | AsyncIterable<Buffer>>
export function encodeAsAsyncIterable(value: any): AsyncIterable<Buffer>

import { Transform, Readable } from 'stream'

export as namespace CBOR;
export class DecoderStream extends Transform {
	constructor(options?: Options | { highWaterMark: number, emitClose: boolean, allowHalfOpen: boolean })
}
export class EncoderStream extends Transform {
	constructor(options?: Options | { highWaterMark: number, emitClose: boolean, allowHalfOpen: boolean })
}
