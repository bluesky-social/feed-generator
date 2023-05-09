let decoder
try {
	decoder = new TextDecoder()
} catch(error) {}
let src
let srcEnd
let position = 0
let alreadySet
const EMPTY_ARRAY = []
const LEGACY_RECORD_INLINE_ID = 105
const RECORD_DEFINITIONS_ID = 0xdffe
const RECORD_INLINE_ID = 0xdfff // temporary first-come first-serve tag // proposed tag: 0x7265 // 're'
const BUNDLED_STRINGS_ID = 0xdff9
const PACKED_TABLE_TAG_ID = 51
const PACKED_REFERENCE_TAG_ID = 6
const STOP_CODE = {}
let strings = EMPTY_ARRAY
let stringPosition = 0
let currentDecoder = {}
let currentStructures
let srcString
let srcStringStart = 0
let srcStringEnd = 0
let bundledStrings
let referenceMap
let currentExtensions = []
let currentExtensionRanges = []
let packedValues
let dataView
let restoreMapsAsObject
let defaultOptions = {
	useRecords: false,
	mapsAsObjects: true
}
let sequentialMode = false

export class Decoder {
	constructor(options) {
		if (options) {
			if ((options.keyMap || options._keyMap) && !options.useRecords) {
				options.useRecords = false
				options.mapsAsObjects = true
			}
			if (options.useRecords === false && options.mapsAsObjects === undefined)
				options.mapsAsObjects = true
			if (options.getStructures)
				options.getShared = options.getStructures
			if (options.getShared && !options.structures)
				(options.structures = []).uninitialized = true // this is what we use to denote an uninitialized structures
			if (options.keyMap) {
				this.mapKey = new Map()
				for (let [k,v] of Object.entries(options.keyMap)) this.mapKey.set(v,k)
			}
		}
		Object.assign(this, options)
	}
	/*
	decodeKey(key) {
		return this.keyMap
			? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
			: key
	}
	*/
	decodeKey(key) {
		return this.keyMap ? this.mapKey.get(key) || key : key
	}
	
	encodeKey(key) {
		return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key
	}

	encodeKeys(rec) {
		if (!this._keyMap) return rec
		let map = new Map()
		for (let [k,v] of Object.entries(rec)) map.set((this._keyMap.hasOwnProperty(k) ? this._keyMap[k] : k), v)
		return map
	}

	decodeKeys(map) {
		if (!this._keyMap || map.constructor.name != 'Map') return map
		if (!this._mapKey) {
			this._mapKey = new Map()
			for (let [k,v] of Object.entries(this._keyMap)) this._mapKey.set(v,k)
		}
		let res = {}
		//map.forEach((v,k) => res[Object.keys(this._keyMap)[Object.values(this._keyMap).indexOf(k)] || k] = v)
		map.forEach((v,k) => res[safeKey(this._mapKey.has(k) ? this._mapKey.get(k) : k)] =  v)
		return res
	}
	
	mapDecode(source, end) {
	
		let res = this.decode(source)
		if (this._keyMap) { 
			//Experiemntal support for Optimised KeyMap  decoding 
			switch (res.constructor.name) {
				case 'Array': return res.map(r => this.decodeKeys(r))
				//case 'Map': return this.decodeKeys(res)
			}
		}
		return res
	}

	decode(source, end) {
		if (src) {
			// re-entrant execution, save the state and restore it after we do this decode
			return saveState(() => {
				clearSource()
				return this ? this.decode(source, end) : Decoder.prototype.decode.call(defaultOptions, source, end)
			})
		}
		srcEnd = end > -1 ? end : source.length
		position = 0
		stringPosition = 0
		srcStringEnd = 0
		srcString = null
		strings = EMPTY_ARRAY
		bundledStrings = null
		src = source
		// this provides cached access to the data view for a buffer if it is getting reused, which is a recommend
		// technique for getting data from a database where it can be copied into an existing buffer instead of creating
		// new ones
		try {
			dataView = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength))
		} catch(error) {
			// if it doesn't have a buffer, maybe it is the wrong type of object
			src = null
			if (source instanceof Uint8Array)
				throw error
			throw new Error('Source must be a Uint8Array or Buffer but was a ' + ((source && typeof source == 'object') ? source.constructor.name : typeof source))
		}
		if (this instanceof Decoder) {
			currentDecoder = this
			packedValues = this.sharedValues &&
				(this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) :
				this.sharedValues)
			if (this.structures) {
				currentStructures = this.structures
				return checkedRead()
			} else if (!currentStructures || currentStructures.length > 0) {
				currentStructures = []
			}
		} else {
			currentDecoder = defaultOptions
			if (!currentStructures || currentStructures.length > 0)
				currentStructures = []
			packedValues = null
		}
		return checkedRead()
	}
	decodeMultiple(source, forEach) {
		let values, lastPosition = 0
		try {
			let size = source.length
			sequentialMode = true
			let value = this ? this.decode(source, size) : defaultDecoder.decode(source, size)
			if (forEach) {
				if (forEach(value) === false) {
					return
				}
				while(position < size) {
					lastPosition = position
					if (forEach(checkedRead()) === false) {
						return
					}
				}
			}
			else {
				values = [ value ]
				while(position < size) {
					lastPosition = position
					values.push(checkedRead())
				}
				return values
			}
		} catch(error) {
			error.lastPosition = lastPosition
			error.values = values
			throw error
		} finally {
			sequentialMode = false
			clearSource()
		}
	}
}
export function getPosition() {
	return position
}
export function checkedRead() {
	try {
		let result = read()
		if (bundledStrings) {
			if (position >= bundledStrings.postBundlePosition) {
				let error = new Error('Unexpected bundle position');
				error.incomplete = true;
				throw error
			}
			// bundled strings to skip past
			position = bundledStrings.postBundlePosition;
			bundledStrings = null;
		}

		if (position == srcEnd) {
			// finished reading this source, cleanup references
			currentStructures = null
			src = null
			if (referenceMap)
				referenceMap = null
		} else if (position > srcEnd) {
			// over read
			let error = new Error('Unexpected end of CBOR data')
			error.incomplete = true
			throw error
		} else if (!sequentialMode) {
			throw new Error('Data read, but end of buffer not reached')
		}
		// else more to read, but we are reading sequentially, so don't clear source yet
		return result
	} catch(error) {
		clearSource()
		if (error instanceof RangeError || error.message.startsWith('Unexpected end of buffer')) {
			error.incomplete = true
		}
		throw error
	}
}

export function read() {
	let token = src[position++]
	let majorType = token >> 5
	token = token & 0x1f
	if (token > 0x17) {
		switch (token) {
			case 0x18:
				token = src[position++]
				break
			case 0x19:
				if (majorType == 7) {
					return getFloat16()
				}
				token = dataView.getUint16(position)
				position += 2
				break
			case 0x1a:
				if (majorType == 7) {
					let value = dataView.getFloat32(position)
					if (currentDecoder.useFloat32 > 2) {
						// this does rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
						let multiplier = mult10[((src[position] & 0x7f) << 1) | (src[position + 1] >> 7)]
						position += 4
						return ((multiplier * value + (value > 0 ? 0.5 : -0.5)) >> 0) / multiplier
					}
					position += 4
					return value
				}
				token = dataView.getUint32(position)
				position += 4
				break
			case 0x1b:
				if (majorType == 7) {
					let value = dataView.getFloat64(position)
					position += 8
					return value
				}
				if (majorType > 1) {
					if (dataView.getUint32(position) > 0)
						throw new Error('JavaScript does not support arrays, maps, or strings with length over 4294967295')
					token = dataView.getUint32(position + 4)
				} else if (currentDecoder.int64AsNumber) {
					token = dataView.getUint32(position) * 0x100000000
					token += dataView.getUint32(position + 4)
				} else
					token = dataView.getBigUint64(position)
				position += 8
				break
			case 0x1f: 
				// indefinite length
				switch(majorType) {
					case 2: // byte string
					case 3: // text string
						throw new Error('Indefinite length not supported for byte or text strings')
					case 4: // array
						let array = []
						let value, i = 0
						while ((value = read()) != STOP_CODE) {
							array[i++] = value
						}
						return majorType == 4 ? array : majorType == 3 ? array.join('') : Buffer.concat(array)
					case 5: // map
						let key
						if (currentDecoder.mapsAsObjects) {
							let object = {}
							if (currentDecoder.keyMap) while((key = read()) != STOP_CODE) object[safeKey(currentDecoder.decodeKey(key))] = read()
							else while ((key = read()) != STOP_CODE) object[safeKey(key)] = read()
							return object
						} else {
							if (restoreMapsAsObject) {
								currentDecoder.mapsAsObjects = true
								restoreMapsAsObject = false
							}
							let map = new Map()
							if (currentDecoder.keyMap) while((key = read()) != STOP_CODE) map.set(currentDecoder.decodeKey(key), read())
							else while ((key = read()) != STOP_CODE) map.set(key, read())
							return map
						}
					case 7:
						return STOP_CODE
					default:
						throw new Error('Invalid major type for indefinite length ' + majorType)
				}
			default:
				throw new Error('Unknown token ' + token)
		}
	}
	switch (majorType) {
		case 0: // positive int
			return token
		case 1: // negative int
			return ~token
		case 2: // buffer
			return readBin(token)
		case 3: // string
			if (srcStringEnd >= position) {
				return srcString.slice(position - srcStringStart, (position += token) - srcStringStart)
			}
			if (srcStringEnd == 0 && srcEnd < 140 && token < 32) {
				// for small blocks, avoiding the overhead of the extract call is helpful
				let string = token < 16 ? shortStringInJS(token) : longStringInJS(token)
				if (string != null)
					return string
			}
			return readFixedString(token)
		case 4: // array
			let array = new Array(token)
		  //if (currentDecoder.keyMap) for (let i = 0; i < token; i++) array[i] = currentDecoder.decodeKey(read())	
			//else 
			for (let i = 0; i < token; i++) array[i] = read()
			return array
		case 5: // map
			if (currentDecoder.mapsAsObjects) {
				let object = {}
				if (currentDecoder.keyMap) for (let i = 0; i < token; i++) object[safeKey(currentDecoder.decodeKey(read()))] = read()
				else for (let i = 0; i < token; i++) object[safeKey(read())] = read()
				return object
			} else {
				if (restoreMapsAsObject) {
					currentDecoder.mapsAsObjects = true
					restoreMapsAsObject = false
				}
				let map = new Map()
				if (currentDecoder.keyMap) for (let i = 0; i < token; i++) map.set(currentDecoder.decodeKey(read()),read())
				else for (let i = 0; i < token; i++) map.set(read(), read())
				return map
			}
		case 6: // extension
			if (token >= BUNDLED_STRINGS_ID) {
				let structure = currentStructures[token & 0x1fff] // check record structures first
				// At some point we may provide an option for dynamic tag assignment with a range like token >= 8 && (token < 16 || (token > 0x80 && token < 0xc0) || (token > 0x130 && token < 0x4000))
				if (structure) {
					if (!structure.read) structure.read = createStructureReader(structure)
					return structure.read()
				}
				if (token < 0x10000) {
					if (token == RECORD_INLINE_ID) { // we do a special check for this so that we can keep the
						// currentExtensions as densely stored array (v8 stores arrays densely under about 3000 elements)
						let length = readJustLength()
						let id = read()
						let structure = read()
						recordDefinition(id, structure)
						let object = {}
						if (currentDecoder.keyMap) for (let i = 2; i < length; i++) {
							let key = currentDecoder.decodeKey(structure[i - 2])
							object[safeKey(key)] = read()
						}
						else for (let i = 2; i < length; i++) {
							let key = structure[i - 2]
							object[safeKey(key)] = read()
						}
						return object
					}
					else if (token == RECORD_DEFINITIONS_ID) {
						let length = readJustLength()
						let id = read()
						for (let i = 2; i < length; i++) {
							recordDefinition(id++, read())
						}
						return read()
					} else if (token == BUNDLED_STRINGS_ID) {
						return readBundleExt()
					}
					if (currentDecoder.getShared) {
						loadShared()
						structure = currentStructures[token & 0x1fff]
						if (structure) {
							if (!structure.read)
								structure.read = createStructureReader(structure)
							return structure.read()
						}
					}
				}
			}
			let extension = currentExtensions[token]
			if (extension) {
				if (extension.handlesRead)
					return extension(read)
				else
					return extension(read())
			} else {
				let input = read()
				for (let i = 0; i < currentExtensionRanges.length; i++) {
					let value = currentExtensionRanges[i](token, input)
					if (value !== undefined)
						return value
				}
				return new Tag(input, token)
			}
		case 7: // fixed value
			switch (token) {
				case 0x14: return false
				case 0x15: return true
				case 0x16: return null
				case 0x17: return; // undefined
				case 0x1f:
				default:
					let packedValue = (packedValues || getPackedValues())[token]
					if (packedValue !== undefined)
						return packedValue
					throw new Error('Unknown token ' + token)
			}
		default: // negative int
			if (isNaN(token)) {
				let error = new Error('Unexpected end of CBOR data')
				error.incomplete = true
				throw error
			}
			throw new Error('Unknown CBOR token ' + token)
	}
}
const validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/
function createStructureReader(structure) {
	function readObject() {
		// get the array size from the header
		let length = src[position++]
		//let majorType = token >> 5
		length = length & 0x1f
		if (length > 0x17) {
			switch (length) {
				case 0x18:
					length = src[position++]
					break
				case 0x19:
					length = dataView.getUint16(position)
					position += 2
					break
				case 0x1a:
					length = dataView.getUint32(position)
					position += 4
					break
				default:
					throw new Error('Expected array header, but got ' + src[position - 1])
			}
		}
		// This initial function is quick to instantiate, but runs slower. After several iterations pay the cost to build the faster function
		let compiledReader = this.compiledReader // first look to see if we have the fast compiled function
		while(compiledReader) {
			// we have a fast compiled object literal reader
			if (compiledReader.propertyCount === length)
				return compiledReader(read) // with the right length, so we use it
			compiledReader = compiledReader.next // see if there is another reader with the right length
		}
		if (this.slowReads++ >= 3) { // create a fast compiled reader
			let array = this.length == length ? this : this.slice(0, length)
			compiledReader = currentDecoder.keyMap 
			? new Function('r', 'return {' + array.map(k => currentDecoder.decodeKey(k)).map(k => validName.test(k) ? safeKey(k) + ':r()' : ('[' + JSON.stringify(k) + ']:r()')).join(',') + '}')
			: new Function('r', 'return {' + array.map(key => validName.test(key) ? safeKey(key) + ':r()' : ('[' + JSON.stringify(key) + ']:r()')).join(',') + '}')
			if (this.compiledReader)
				compiledReader.next = this.compiledReader // if there is an existing one, we store multiple readers as a linked list because it is usually pretty rare to have multiple readers (of different length) for the same structure
			compiledReader.propertyCount = length
			this.compiledReader = compiledReader
			return compiledReader(read)
		}
		let object = {}
		if (currentDecoder.keyMap) for (let i = 0; i < length; i++) object[safeKey(currentDecoder.decodeKey(this[i]))] = read()
		else for (let i = 0; i < length; i++) {
			object[safeKey(this[i])] = read();
		}
		return object
	}
	structure.slowReads = 0
	return readObject
}

function safeKey(key) {
	return key === '__proto__' ? '__proto_' : key
}

let readFixedString = readStringJS
let readString8 = readStringJS
let readString16 = readStringJS
let readString32 = readStringJS

export let isNativeAccelerationEnabled = false
export function setExtractor(extractStrings) {
	isNativeAccelerationEnabled = true
	readFixedString = readString(1)
	readString8 = readString(2)
	readString16 = readString(3)
	readString32 = readString(5)
	function readString(headerLength) {
		return function readString(length) {
			let string = strings[stringPosition++]
			if (string == null) {
				if (bundledStrings)
					return readStringJS(length)
				let extraction = extractStrings(position, srcEnd, length, src)
				if (typeof extraction == 'string') {
					string = extraction
					strings = EMPTY_ARRAY
				} else {
					strings = extraction
					stringPosition = 1
					srcStringEnd = 1 // even if a utf-8 string was decoded, must indicate we are in the midst of extracted strings and can't skip strings
					string = strings[0]
					if (string === undefined)
						throw new Error('Unexpected end of buffer')
				}
			}
			let srcStringLength = string.length
			if (srcStringLength <= length) {
				position += length
				return string
			}
			srcString = string
			srcStringStart = position
			srcStringEnd = position + srcStringLength
			position += length
			return string.slice(0, length) // we know we just want the beginning
		}
	}
}
function readStringJS(length) {
	let result
	if (length < 16) {
		if (result = shortStringInJS(length))
			return result
	}
	if (length > 64 && decoder)
		return decoder.decode(src.subarray(position, position += length))
	const end = position + length
	const units = []
	result = ''
	while (position < end) {
		const byte1 = src[position++]
		if ((byte1 & 0x80) === 0) {
			// 1 byte
			units.push(byte1)
		} else if ((byte1 & 0xe0) === 0xc0) {
			// 2 bytes
			const byte2 = src[position++] & 0x3f
			units.push(((byte1 & 0x1f) << 6) | byte2)
		} else if ((byte1 & 0xf0) === 0xe0) {
			// 3 bytes
			const byte2 = src[position++] & 0x3f
			const byte3 = src[position++] & 0x3f
			units.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3)
		} else if ((byte1 & 0xf8) === 0xf0) {
			// 4 bytes
			const byte2 = src[position++] & 0x3f
			const byte3 = src[position++] & 0x3f
			const byte4 = src[position++] & 0x3f
			let unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4
			if (unit > 0xffff) {
				unit -= 0x10000
				units.push(((unit >>> 10) & 0x3ff) | 0xd800)
				unit = 0xdc00 | (unit & 0x3ff)
			}
			units.push(unit)
		} else {
			units.push(byte1)
		}

		if (units.length >= 0x1000) {
			result += fromCharCode.apply(String, units)
			units.length = 0
		}
	}

	if (units.length > 0) {
		result += fromCharCode.apply(String, units)
	}

	return result
}
let fromCharCode = String.fromCharCode
function longStringInJS(length) {
	let start = position
	let bytes = new Array(length)
	for (let i = 0; i < length; i++) {
		const byte = src[position++];
		if ((byte & 0x80) > 0) {
			position = start
    			return
    		}
    		bytes[i] = byte
    	}
    	return fromCharCode.apply(String, bytes)
}
function shortStringInJS(length) {
	if (length < 4) {
		if (length < 2) {
			if (length === 0)
				return ''
			else {
				let a = src[position++]
				if ((a & 0x80) > 1) {
					position -= 1
					return
				}
				return fromCharCode(a)
			}
		} else {
			let a = src[position++]
			let b = src[position++]
			if ((a & 0x80) > 0 || (b & 0x80) > 0) {
				position -= 2
				return
			}
			if (length < 3)
				return fromCharCode(a, b)
			let c = src[position++]
			if ((c & 0x80) > 0) {
				position -= 3
				return
			}
			return fromCharCode(a, b, c)
		}
	} else {
		let a = src[position++]
		let b = src[position++]
		let c = src[position++]
		let d = src[position++]
		if ((a & 0x80) > 0 || (b & 0x80) > 0 || (c & 0x80) > 0 || (d & 0x80) > 0) {
			position -= 4
			return
		}
		if (length < 6) {
			if (length === 4)
				return fromCharCode(a, b, c, d)
			else {
				let e = src[position++]
				if ((e & 0x80) > 0) {
					position -= 5
					return
				}
				return fromCharCode(a, b, c, d, e)
			}
		} else if (length < 8) {
			let e = src[position++]
			let f = src[position++]
			if ((e & 0x80) > 0 || (f & 0x80) > 0) {
				position -= 6
				return
			}
			if (length < 7)
				return fromCharCode(a, b, c, d, e, f)
			let g = src[position++]
			if ((g & 0x80) > 0) {
				position -= 7
				return
			}
			return fromCharCode(a, b, c, d, e, f, g)
		} else {
			let e = src[position++]
			let f = src[position++]
			let g = src[position++]
			let h = src[position++]
			if ((e & 0x80) > 0 || (f & 0x80) > 0 || (g & 0x80) > 0 || (h & 0x80) > 0) {
				position -= 8
				return
			}
			if (length < 10) {
				if (length === 8)
					return fromCharCode(a, b, c, d, e, f, g, h)
				else {
					let i = src[position++]
					if ((i & 0x80) > 0) {
						position -= 9
						return
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i)
				}
			} else if (length < 12) {
				let i = src[position++]
				let j = src[position++]
				if ((i & 0x80) > 0 || (j & 0x80) > 0) {
					position -= 10
					return
				}
				if (length < 11)
					return fromCharCode(a, b, c, d, e, f, g, h, i, j)
				let k = src[position++]
				if ((k & 0x80) > 0) {
					position -= 11
					return
				}
				return fromCharCode(a, b, c, d, e, f, g, h, i, j, k)
			} else {
				let i = src[position++]
				let j = src[position++]
				let k = src[position++]
				let l = src[position++]
				if ((i & 0x80) > 0 || (j & 0x80) > 0 || (k & 0x80) > 0 || (l & 0x80) > 0) {
					position -= 12
					return
				}
				if (length < 14) {
					if (length === 12)
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l)
					else {
						let m = src[position++]
						if ((m & 0x80) > 0) {
							position -= 13
							return
						}
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m)
					}
				} else {
					let m = src[position++]
					let n = src[position++]
					if ((m & 0x80) > 0 || (n & 0x80) > 0) {
						position -= 14
						return
					}
					if (length < 15)
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n)
					let o = src[position++]
					if ((o & 0x80) > 0) {
						position -= 15
						return
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
				}
			}
		}
	}
}

function readBin(length) {
	return currentDecoder.copyBuffers ?
		// specifically use the copying slice (not the node one)
		Uint8Array.prototype.slice.call(src, position, position += length) :
		src.subarray(position, position += length)
}
function readExt(length) {
	let type = src[position++]
	if (currentExtensions[type]) {
		return currentExtensions[type](src.subarray(position, position += length))
	}
	else
		throw new Error('Unknown extension type ' + type)
}
let f32Array = new Float32Array(1)
let u8Array = new Uint8Array(f32Array.buffer, 0, 4)
function getFloat16() {
	let byte0 = src[position++]
	let byte1 = src[position++]
	let exponent = (byte0 & 0x7f) >> 2;
	if (exponent === 0x1f) { // specials
		if (byte1 || (byte0 & 3))
			return NaN;
		return (byte0 & 0x80) ? -Infinity : Infinity;
	}
	if (exponent === 0) { // sub-normals
		// significand with 10 fractional bits and divided by 2^14
		let abs = (((byte0 & 3) << 8) | byte1) / (1 << 24)
		return (byte0 & 0x80) ? -abs : abs
	}

	u8Array[3] = (byte0 & 0x80) | // sign bit
		((exponent >> 1) + 56) // 4 of 5 of the exponent bits, re-offset-ed
	u8Array[2] = ((byte0 & 7) << 5) | // last exponent bit and first two mantissa bits
		(byte1 >> 3) // next 5 bits of mantissa
	u8Array[1] = byte1 << 5; // last three bits of mantissa
	u8Array[0] = 0;
	return f32Array[0];
}

let keyCache = new Array(4096)
function readKey() {
	let length = src[position++]
	if (length >= 0x60 && length < 0x78) {
		// fixstr, potentially use key cache
		length = length - 0x60
		if (srcStringEnd >= position) // if it has been extracted, must use it (and faster anyway)
			return srcString.slice(position - srcStringStart, (position += length) - srcStringStart)
		else if (!(srcStringEnd == 0 && srcEnd < 180))
			return readFixedString(length)
	} else { // not cacheable, go back and do a standard read
		position--
		return read()
	}
	let key = ((length << 5) ^ (length > 1 ? dataView.getUint16(position) : length > 0 ? src[position] : 0)) & 0xfff
	let entry = keyCache[key]
	let checkPosition = position
	let end = position + length - 3
	let chunk
	let i = 0
	if (entry && entry.bytes == length) {
		while (checkPosition < end) {
			chunk = dataView.getUint32(checkPosition)
			if (chunk != entry[i++]) {
				checkPosition = 0x70000000
				break
			}
			checkPosition += 4
		}
		end += 3
		while (checkPosition < end) {
			chunk = src[checkPosition++]
			if (chunk != entry[i++]) {
				checkPosition = 0x70000000
				break
			}
		}
		if (checkPosition === end) {
			position = checkPosition
			return entry.string
		}
		end -= 3
		checkPosition = position
	}
	entry = []
	keyCache[key] = entry
	entry.bytes = length
	while (checkPosition < end) {
		chunk = dataView.getUint32(checkPosition)
		entry.push(chunk)
		checkPosition += 4
	}
	end += 3
	while (checkPosition < end) {
		chunk = src[checkPosition++]
		entry.push(chunk)
	}
	// for small blocks, avoiding the overhead of the extract call is helpful
	let string = length < 16 ? shortStringInJS(length) : longStringInJS(length)
	if (string != null)
		return entry.string = string
	return entry.string = readFixedString(length)
}

export class Tag {
	constructor(value, tag) {
		this.value = value
		this.tag = tag
	}
}

currentExtensions[0] = (dateString) => {
	// string date extension
	return new Date(dateString)
}

currentExtensions[1] = (epochSec) => {
	// numeric date extension
	return new Date(Math.round(epochSec * 1000))
}

currentExtensions[2] = (buffer) => {
	// bigint extension
	let value = BigInt(0)
	for (let i = 0, l = buffer.byteLength; i < l; i++) {
		value = BigInt(buffer[i]) + value << BigInt(8)
	}
	return value
}

currentExtensions[3] = (buffer) => {
	// negative bigint extension
	return BigInt(-1) - currentExtensions[2](buffer)
}
currentExtensions[4] = (fraction) => {
	// best to reparse to maintain accuracy
	return +(fraction[1] + 'e' + fraction[0])
}

currentExtensions[5] = (fraction) => {
	// probably not sufficiently accurate
	return fraction[1] * Math.exp(fraction[0] * Math.log(2))
}

// the registration of the record definition extension
const recordDefinition = (id, structure) => {
	id = id - 0xe000
	let existingStructure = currentStructures[id]
	if (existingStructure && existingStructure.isShared) {
		(currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure
	}
	currentStructures[id] = structure

	structure.read = createStructureReader(structure)
}
currentExtensions[LEGACY_RECORD_INLINE_ID] = (data) => {
	let length = data.length
	let structure = data[1]
	recordDefinition(data[0], structure)
	let object = {}
	for (let i = 2; i < length; i++) {
		let key = structure[i - 2]
		object[safeKey(key)] = data[i]
	}
	return object
}
currentExtensions[14] = (value) => {
	if (bundledStrings)
		return bundledStrings[0].slice(bundledStrings.position0, bundledStrings.position0 += value)
	return new Tag(value, 14)
}
currentExtensions[15] = (value) => {
	if (bundledStrings)
		return bundledStrings[1].slice(bundledStrings.position1, bundledStrings.position1 += value)
	return new Tag(value, 15)
}
let glbl = { Error, RegExp }
currentExtensions[27] = (data) => { // http://cbor.schmorp.de/generic-object
	return (glbl[data[0]] || Error)(data[1], data[2])
}
const packedTable = (read) => {
	if (src[position++] != 0x84)
		throw new Error('Packed values structure must be followed by a 4 element array')
	let newPackedValues = read() // packed values
	packedValues = packedValues ? newPackedValues.concat(packedValues.slice(newPackedValues.length)) : newPackedValues
	packedValues.prefixes = read()
	packedValues.suffixes = read()
	return read() // read the rump
}
packedTable.handlesRead = true
currentExtensions[51] = packedTable

currentExtensions[PACKED_REFERENCE_TAG_ID] = (data) => { // packed reference
	if (!packedValues) {
		if (currentDecoder.getShared)
			loadShared()
		else
			return new Tag(data, PACKED_REFERENCE_TAG_ID)
	}
	if (typeof data == 'number')
		return packedValues[16 + (data >= 0 ? 2 * data : (-2 * data - 1))]
	throw new Error('No support for non-integer packed references yet')
}

// The following code is an incomplete implementation of http://cbor.schmorp.de/stringref
// the real thing would need to implemennt more logic to populate the stringRefs table and
// maintain a stack of stringRef "namespaces".
//
// currentExtensions[25] = (id) => {
// 	return stringRefs[id]
// }
// currentExtensions[256] = (read) => {
// 	stringRefs = []
// 	try {
// 		return read()
// 	} finally {
// 		stringRefs = null
// 	}
// }
// currentExtensions[256].handlesRead = true

currentExtensions[28] = (read) => { 
	// shareable http://cbor.schmorp.de/value-sharing (for structured clones)
	if (!referenceMap) {
		referenceMap = new Map()
		referenceMap.id = 0
	}
	let id = referenceMap.id++
	let token = src[position]
	let target
	// TODO: handle Maps, Sets, and other types that can cycle; this is complicated, because you potentially need to read
	// ahead past references to record structure definitions
	if ((token >> 5) == 4)
		target = []
	else
		target = {}

	let refEntry = { target } // a placeholder object
	referenceMap.set(id, refEntry)
	let targetProperties = read() // read the next value as the target object to id
	if (refEntry.used) // there is a cycle, so we have to assign properties to original target
		return Object.assign(target, targetProperties)
	refEntry.target = targetProperties // the placeholder wasn't used, replace with the deserialized one
	return targetProperties // no cycle, can just use the returned read object
}
currentExtensions[28].handlesRead = true

currentExtensions[29] = (id) => {
	// sharedref http://cbor.schmorp.de/value-sharing (for structured clones)
	let refEntry = referenceMap.get(id)
	refEntry.used = true
	return refEntry.target
}

currentExtensions[258] = (array) => new Set(array); // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
(currentExtensions[259] = (read) => {
	// https://github.com/shanewholloway/js-cbor-codec/blob/master/docs/CBOR-259-spec
	// for decoding as a standard Map
	if (currentDecoder.mapsAsObjects) {
		currentDecoder.mapsAsObjects = false
		restoreMapsAsObject = true
	}
	return read()
}).handlesRead = true
function combine(a, b) {
	if (typeof a === 'string')
		return a + b
	if (a instanceof Array)
		return a.concat(b)
	return Object.assign({}, a, b)
}
function getPackedValues() {
	if (!packedValues) {
		if (currentDecoder.getShared)
			loadShared()
		else
			throw new Error('No packed values available')
	}
	return packedValues
}
const SHARED_DATA_TAG_ID = 0x53687264 // ascii 'Shrd'
currentExtensionRanges.push((tag, input) => {
	if (tag >= 225 && tag <= 255)
		return combine(getPackedValues().prefixes[tag - 224], input)
	if (tag >= 28704 && tag <= 32767)
		return combine(getPackedValues().prefixes[tag - 28672], input)
	if (tag >= 1879052288 && tag <= 2147483647)
		return combine(getPackedValues().prefixes[tag - 1879048192], input)
	if (tag >= 216 && tag <= 223)
		return combine(input, getPackedValues().suffixes[tag - 216])
	if (tag >= 27647 && tag <= 28671)
		return combine(input, getPackedValues().suffixes[tag - 27639])
	if (tag >= 1811940352 && tag <= 1879048191)
		return combine(input, getPackedValues().suffixes[tag - 1811939328])
	if (tag == SHARED_DATA_TAG_ID) {// we do a special check for this so that we can keep the currentExtensions as densely stored array (v8 stores arrays densely under about 3000 elements)
		return {
			packedValues: packedValues,
			structures: currentStructures.slice(0),
			version: input,
		}
	}
	if (tag == 55799) // self-descriptive CBOR tag, just return input value
		return input
})

const isLittleEndianMachine = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1
export const typedArrays = [Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array,
	typeof BigUint64Array == 'undefined' ? { name:'BigUint64Array' } : BigUint64Array, Int8Array, Int16Array, Int32Array,
	typeof BigInt64Array == 'undefined' ? { name:'BigInt64Array' } : BigInt64Array, Float32Array, Float64Array]
const typedArrayTags = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86]
for (let i = 0; i < typedArrays.length; i++) {
	registerTypedArray(typedArrays[i], typedArrayTags[i])
}
function registerTypedArray(TypedArray, tag) {
	let dvMethod = 'get' + TypedArray.name.slice(0, -5)
	let bytesPerElement;
	if (typeof TypedArray === 'function')
		bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
	else
		TypedArray = null;
	for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
		if (!littleEndian && bytesPerElement == 1)
			continue
		let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : 3
		currentExtensions[littleEndian ? tag : (tag - 4)] = (bytesPerElement == 1 || littleEndian == isLittleEndianMachine) ? (buffer) => {
			if (!TypedArray)
				throw new Error('Could not find typed array for code ' + tag)
			// we have to always slice/copy here to get a new ArrayBuffer that is word/byte aligned
			return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer)
		} : buffer => {
			if (!TypedArray)
				throw new Error('Could not find typed array for code ' + tag)
			let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
			let elements = buffer.length >> sizeShift
			let ta = new TypedArray(elements)
			let method = dv[dvMethod]
			for (let i = 0; i < elements; i++) {
				ta[i] = method.call(dv, i << sizeShift, littleEndian)
			}
			return ta
		}
	}
}

function readBundleExt() {
	let length = readJustLength()
	let bundlePosition = position + read()
	for (let i = 2; i < length; i++) {
		// skip past bundles that were already read
		let bundleLength = readJustLength() // this will increment position, so must add to position afterwards
		position += bundleLength
	}
	let dataPosition = position
	position = bundlePosition
	bundledStrings = [readStringJS(readJustLength()), readStringJS(readJustLength())]
	bundledStrings.position0 = 0
	bundledStrings.position1 = 0
	bundledStrings.postBundlePosition = position
	position = dataPosition
	return read()
}

function readJustLength() {
	let token = src[position++] & 0x1f
	if (token > 0x17) {
		switch (token) {
			case 0x18:
				token = src[position++]
				break
			case 0x19:
				token = dataView.getUint16(position)
				position += 2
				break
			case 0x1a:
				token = dataView.getUint32(position)
				position += 4
				break
		}
	}
	return token
}

function loadShared() {
	if (currentDecoder.getShared) {
		let sharedData = saveState(() => {
			// save the state in case getShared modifies our buffer
			src = null
			return currentDecoder.getShared()
		}) || {}
		let updatedStructures = sharedData.structures || []
		currentDecoder.sharedVersion = sharedData.version
		packedValues = currentDecoder.sharedValues = sharedData.packedValues
		if (currentStructures === true)
			currentDecoder.structures = currentStructures = updatedStructures
		else
			currentStructures.splice.apply(currentStructures, [0, updatedStructures.length].concat(updatedStructures))
	}
}

function saveState(callback) {
	let savedSrcEnd = srcEnd
	let savedPosition = position
	let savedStringPosition = stringPosition
	let savedSrcStringStart = srcStringStart
	let savedSrcStringEnd = srcStringEnd
	let savedSrcString = srcString
	let savedStrings = strings
	let savedReferenceMap = referenceMap
	let savedBundledStrings = bundledStrings

	// TODO: We may need to revisit this if we do more external calls to user code (since it could be slow)
	let savedSrc = new Uint8Array(src.slice(0, srcEnd)) // we copy the data in case it changes while external data is processed
	let savedStructures = currentStructures
	let savedDecoder = currentDecoder
	let savedSequentialMode = sequentialMode
	let value = callback()
	srcEnd = savedSrcEnd
	position = savedPosition
	stringPosition = savedStringPosition
	srcStringStart = savedSrcStringStart
	srcStringEnd = savedSrcStringEnd
	srcString = savedSrcString
	strings = savedStrings
	referenceMap = savedReferenceMap
	bundledStrings = savedBundledStrings
	src = savedSrc
	sequentialMode = savedSequentialMode
	currentStructures = savedStructures
	currentDecoder = savedDecoder
	dataView = new DataView(src.buffer, src.byteOffset, src.byteLength)
	return value
}
export function clearSource() {
	src = null
	referenceMap = null
	currentStructures = null
}

export function addExtension(extension) {
	currentExtensions[extension.tag] = extension.decode
}

export const mult10 = new Array(147) // this is a table matching binary exponents to the multiplier to determine significant digit rounding
for (let i = 0; i < 256; i++) {
	mult10[i] = +('1e' + Math.floor(45.15 - i * 0.30103))
}
let defaultDecoder = new Decoder({ useRecords: false })
export const decode = defaultDecoder.decode
export const decodeMultiple = defaultDecoder.decodeMultiple
export const FLOAT32_OPTIONS = {
	NEVER: 0,
	ALWAYS: 1,
	DECIMAL_ROUND: 3,
	DECIMAL_FIT: 4
}
export function roundFloat32(float32Number) {
	f32Array[0] = float32Number
	let multiplier = mult10[((u8Array[3] & 0x7f) << 1) | (u8Array[2] >> 7)]
	return ((multiplier * float32Number + (float32Number > 0 ? 0.5 : -0.5)) >> 0) / multiplier
}
