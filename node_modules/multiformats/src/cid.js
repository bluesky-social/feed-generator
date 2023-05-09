import * as varint from './varint.js'
import * as Digest from './hashes/digest.js'
import { base58btc } from './bases/base58.js'
import { base32 } from './bases/base32.js'
import { coerce } from './bytes.js'

/**
 * @typedef {import('./hashes/interface').MultihashDigest} MultihashDigest
 * @typedef {0 | 1} CIDVersion
 */

/**
 * @template Prefix
 * @typedef {import('./bases/interface').MultibaseEncoder<Prefix>} MultibaseEncoder
 */

/**
 * @template Prefix
 * @typedef {import('./bases/interface').MultibaseDecoder<Prefix>} MultibaseDecoder
 */

export class CID {
  /**
   * @param {CIDVersion} version
   * @param {number} code - multicodec code, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param {MultihashDigest} multihash
   * @param {Uint8Array} bytes
   *
   */
  constructor (version, code, multihash, bytes) {
    this.code = code
    this.version = version
    this.multihash = multihash
    this.bytes = bytes

    // ArrayBufferView
    this.byteOffset = bytes.byteOffset
    this.byteLength = bytes.byteLength

    // Circular reference
    /** @private */
    this.asCID = this
    /**
     * @type {Map<string, string>}
     * @private
     */
    this._baseCache = new Map()

    // Configure private properties
    Object.defineProperties(this, {
      byteOffset: hidden,
      byteLength: hidden,

      code: readonly,
      version: readonly,
      multihash: readonly,
      bytes: readonly,

      _baseCache: hidden,
      asCID: hidden
    })
  }

  /**
   * @returns {CID}
   */
  toV0 () {
    switch (this.version) {
      case 0: {
        return this
      }
      default: {
        const { code, multihash } = this

        if (code !== DAG_PB_CODE) {
          throw new Error('Cannot convert a non dag-pb CID to CIDv0')
        }

        // sha2-256
        if (multihash.code !== SHA_256_CODE) {
          throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0')
        }

        return CID.createV0(multihash)
      }
    }
  }

  /**
   * @returns {CID}
   */
  toV1 () {
    switch (this.version) {
      case 0: {
        const { code, digest } = this.multihash
        const multihash = Digest.create(code, digest)
        return CID.createV1(this.code, multihash)
      }
      case 1: {
        return this
      }
      /* c8 ignore next 3 */
      default: {
        throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`)
      }
    }
  }

  /**
   * @param {any} other
   */
  equals (other) {
    return other &&
        this.code === other.code &&
        this.version === other.version &&
        Digest.equals(this.multihash, other.multihash)
  }

  /**
   * @param {MultibaseEncoder<any>} [base]
   * @returns {string}
   */
  toString (base) {
    const { bytes, version, _baseCache } = this
    switch (version) {
      case 0:
        return toStringV0(bytes, _baseCache, base || base58btc.encoder)
      default:
        return toStringV1(bytes, _baseCache, base || base32.encoder)
    }
  }

  toJSON () {
    return {
      code: this.code,
      version: this.version,
      hash: this.multihash.bytes
    }
  }

  get [Symbol.toStringTag] () {
    return 'CID'
  }

  // Legacy

  [Symbol.for('nodejs.util.inspect.custom')] () {
    return 'CID(' + this.toString() + ')'
  }

  // Deprecated

  /**
   * @param {any} value
   * @returns {value is CID}
   */
  static isCID (value) {
    deprecate(/^0\.0/, IS_CID_DEPRECATION)
    return !!(value && (value[cidSymbol] || value.asCID === value))
  }

  get toBaseEncodedString () {
    throw new Error('Deprecated, use .toString()')
  }

  get codec () {
    throw new Error('"codec" property is deprecated, use integer "code" property instead')
  }

  get buffer () {
    throw new Error('Deprecated .buffer property, use .bytes to get Uint8Array instead')
  }

  get multibaseName () {
    throw new Error('"multibaseName" property is deprecated')
  }

  get prefix () {
    throw new Error('"prefix" property is deprecated')
  }

  /**
   * Takes any input `value` and returns a `CID` instance if it was
   * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
   * it will return value back. If `value` is not instance of this CID
   * class, but is compatible CID it will return new instance of this
   * `CID` class. Otherwise returs null.
   *
   * This allows two different incompatible versions of CID library to
   * co-exist and interop as long as binary interface is compatible.
   * @param {any} value
   * @returns {CID|null}
   */
  static asCID (value) {
    if (value instanceof CID) {
    // If value is instance of CID then we're all set.
      return value
    } else if (value != null && value.asCID === value) {
    // If value isn't instance of this CID class but `this.asCID === this` is
    // true it is CID instance coming from a different implementation (diff
    // version or duplicate). In that case we rebase it to this `CID`
    // implementation so caller is guaranteed to get instance with expected
    // API.
      const { version, code, multihash, bytes } = value
      return new CID(version, code, multihash, bytes || encodeCID(version, code, multihash.bytes))
    } else if (value != null && value[cidSymbol] === true) {
    // If value is a CID from older implementation that used to be tagged via
    // symbol we still rebase it to this `CID` implementation by
    // delegating that to a constructor.
      const { version, multihash, code } = value
      const digest = Digest.decode(multihash)
      return CID.create(version, code, digest)
    } else {
    // Otherwise value is not a CID (or an incompatible version of it) in
    // which case we return `null`.
      return null
    }
  }

  /**
 *
 * @param {CIDVersion} version - Version of the CID
 * @param {number} code - Code of the codec content is encoded in.
 * @param {MultihashDigest} digest - (Multi)hash of the of the content.
 * @returns {CID}
 */
  static create (version, code, digest) {
    if (typeof code !== 'number') {
      throw new Error('String codecs are no longer supported')
    }

    switch (version) {
      case 0: {
        if (code !== DAG_PB_CODE) {
          throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`)
        } else {
          return new CID(version, code, digest, digest.bytes)
        }
      }
      case 1: {
        const bytes = encodeCID(version, code, digest.bytes)
        return new CID(version, code, digest, bytes)
      }
      default: {
        throw new Error('Invalid version')
      }
    }
  }

  /**
   * Simplified version of `create` for CIDv0.
   * @param {MultihashDigest} digest - Multihash.
   */
  static createV0 (digest) {
    return CID.create(0, DAG_PB_CODE, digest)
  }

  /**
 * Simplified version of `create` for CIDv1.
 * @template {number} Code
 * @param {Code} code - Content encoding format code.
 * @param {MultihashDigest} digest - Miltihash of the content.
 * @returns {CID}
 */
  static createV1 (code, digest) {
    return CID.create(1, code, digest)
  }

  /**
   * Decoded a CID from its binary representation. The byte array must contain
   * only the CID with no additional bytes.
   *
   * An error will be thrown if the bytes provided do not contain a valid
   * binary representation of a CID.
   *
   * @param {Uint8Array} bytes
   * @returns {CID}
   */
  static decode (bytes) {
    const [cid, remainder] = CID.decodeFirst(bytes)
    if (remainder.length) {
      throw new Error('Incorrect length')
    }
    return cid
  }

  /**
   * Decoded a CID from its binary representation at the beginning of a byte
   * array.
   *
   * Returns an array with the first element containing the CID and the second
   * element containing the remainder of the original byte array. The remainder
   * will be a zero-length byte array if the provided bytes only contained a
   * binary CID representation.
   *
   * @param {Uint8Array} bytes
   * @returns {[CID, Uint8Array]}
   */
  static decodeFirst (bytes) {
    const specs = CID.inspectBytes(bytes)
    const prefixSize = specs.size - specs.multihashSize
    const multihashBytes = coerce(bytes.subarray(prefixSize, prefixSize + specs.multihashSize))
    if (multihashBytes.byteLength !== specs.multihashSize) {
      throw new Error('Incorrect length')
    }
    const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize)
    const digest = new Digest.Digest(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes)
    const cid = specs.version === 0 ? CID.createV0(digest) : CID.createV1(specs.codec, digest)
    return [cid, bytes.subarray(specs.size)]
  }

  /**
   * Inspect the initial bytes of a CID to determine its properties.
   *
   * Involves decoding up to 4 varints. Typically this will require only 4 to 6
   * bytes but for larger multicodec code values and larger multihash digest
   * lengths these varints can be quite large. It is recommended that at least
   * 10 bytes be made available in the `initialBytes` argument for a complete
   * inspection.
   *
   * @param {Uint8Array} initialBytes
   * @returns {{ version:CIDVersion, codec:number, multihashCode:number, digestSize:number, multihashSize:number, size:number }}
   */
  static inspectBytes (initialBytes) {
    let offset = 0
    const next = () => {
      const [i, length] = varint.decode(initialBytes.subarray(offset))
      offset += length
      return i
    }

    let version = next()
    let codec = DAG_PB_CODE
    if (version === 18) { // CIDv0
      version = 0
      offset = 0
    } else if (version === 1) {
      codec = next()
    }

    if (version !== 0 && version !== 1) {
      throw new RangeError(`Invalid CID version ${version}`)
    }

    const prefixSize = offset
    const multihashCode = next() // multihash code
    const digestSize = next() // multihash length
    const size = offset + digestSize
    const multihashSize = size - prefixSize

    return { version, codec, multihashCode, digestSize, multihashSize, size }
  }

  /**
   * Takes cid in a string representation and creates an instance. If `base`
   * decoder is not provided will use a default from the configuration. It will
   * throw an error if encoding of the CID is not compatible with supplied (or
   * a default decoder).
   *
   * @template {string} Prefix
   * @param {string} source
   * @param {MultibaseDecoder<Prefix>} [base]
   */
  static parse (source, base) {
    const [prefix, bytes] = parseCIDtoBytes(source, base)

    const cid = CID.decode(bytes)
    // Cache string representation to avoid computing it on `this.toString()`
    // @ts-ignore - Can't access private
    cid._baseCache.set(prefix, source)

    return cid
  }
}

/**
 * @template {string} Prefix
 * @param {string} source
 * @param {MultibaseDecoder<Prefix>} [base]
 * @returns {[string, Uint8Array]}
 */
const parseCIDtoBytes = (source, base) => {
  switch (source[0]) {
    // CIDv0 is parsed differently
    case 'Q': {
      const decoder = base || base58btc
      return [base58btc.prefix, decoder.decode(`${base58btc.prefix}${source}`)]
    }
    case base58btc.prefix: {
      const decoder = base || base58btc
      return [base58btc.prefix, decoder.decode(source)]
    }
    case base32.prefix: {
      const decoder = base || base32
      return [base32.prefix, decoder.decode(source)]
    }
    default: {
      if (base == null) {
        throw Error('To parse non base32 or base58btc encoded CID multibase decoder must be provided')
      }
      return [source[0], base.decode(source)]
    }
  }
}

/**
 *
 * @param {Uint8Array} bytes
 * @param {Map<string, string>} cache
 * @param {MultibaseEncoder<'z'>} base
 */
const toStringV0 = (bytes, cache, base) => {
  const { prefix } = base
  if (prefix !== base58btc.prefix) {
    throw Error(`Cannot string encode V0 in ${base.name} encoding`)
  }

  const cid = cache.get(prefix)
  if (cid == null) {
    const cid = base.encode(bytes).slice(1)
    cache.set(prefix, cid)
    return cid
  } else {
    return cid
  }
}

/**
 * @template {string} Prefix
 * @param {Uint8Array} bytes
 * @param {Map<string, string>} cache
 * @param {MultibaseEncoder<Prefix>} base
 */
const toStringV1 = (bytes, cache, base) => {
  const { prefix } = base
  const cid = cache.get(prefix)
  if (cid == null) {
    const cid = base.encode(bytes)
    cache.set(prefix, cid)
    return cid
  } else {
    return cid
  }
}

const DAG_PB_CODE = 0x70
const SHA_256_CODE = 0x12

/**
 * @param {CIDVersion} version
 * @param {number} code
 * @param {Uint8Array} multihash
 * @returns {Uint8Array}
 */
const encodeCID = (version, code, multihash) => {
  const codeOffset = varint.encodingLength(version)
  const hashOffset = codeOffset + varint.encodingLength(code)
  const bytes = new Uint8Array(hashOffset + multihash.byteLength)
  varint.encodeTo(version, bytes, 0)
  varint.encodeTo(code, bytes, codeOffset)
  bytes.set(multihash, hashOffset)
  return bytes
}

const cidSymbol = Symbol.for('@ipld/js-cid/CID')
const readonly = { writable: false, configurable: false, enumerable: true }
const hidden = { writable: false, enumerable: false, configurable: false }

// ESM does not support importing package.json where this version info
// should come from. To workaround it version is copied here.
const version = '0.0.0-dev'
// Start throwing exceptions on major version bump
/**
 *
 * @param {RegExp} range
 * @param {string} message
 */
const deprecate = (range, message) => {
  if (range.test(version)) {
    console.warn(message)
  /* c8 ignore next 3 */
  } else {
    throw new Error(message)
  }
}

const IS_CID_DEPRECATION =
`CID.isCID(v) is deprecated and will be removed in the next major release.
Following code pattern:

if (CID.isCID(value)) {
  doSomethingWithCID(value)
}

Is replaced with:

const cid = CID.asCID(value)
if (cid) {
  // Make sure to use cid instead of value
  doSomethingWithCID(cid)
}
`
