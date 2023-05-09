export { Encoder, addExtension, encode, encodeAsIterable, encodeAsAsyncIterable, NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT, REUSE_BUFFER_MODE } from './encode.js'
export { Tag, Decoder, decodeMultiple, decode, FLOAT32_OPTIONS, clearSource, roundFloat32, isNativeAccelerationEnabled } from './decode.js'
export { EncoderStream, DecoderStream } from './stream.js'
export { decodeIter, encodeIter } from './iterators.js'
export const useRecords = false
export const mapsAsObjects = true
import { setExtractor } from './decode.js'
import { createRequire } from 'module'

const nativeAccelerationDisabled = process.env.CBOR_NATIVE_ACCELERATION_DISABLED !== undefined && process.env.CBOR_NATIVE_ACCELERATION_DISABLED.toLowerCase() === 'true';

if (!nativeAccelerationDisabled) {
	let extractor
	try {
		if (typeof require == 'function')
			extractor = require('cbor-extract')
		else
			extractor = createRequire(import.meta.url)('cbor-extract')
		if (extractor)
			setExtractor(extractor.extractStrings)
	} catch (error) {
		// native module is optional
	}
}
