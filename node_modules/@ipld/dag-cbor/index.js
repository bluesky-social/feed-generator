import * as cborg from 'cborg'
import { CID } from 'multiformats/cid'

// https://github.com/ipfs/go-ipfs/issues/3570#issuecomment-273931692
const CID_CBOR_TAG = 42

/**
 * @template T
 * @typedef {import('multiformats/codecs/interface').ByteView<T>} ByteView
*/

/**
 * cidEncoder will receive all Objects during encode, it needs to filter out
 * anything that's not a CID and return `null` for that so it's encoded as
 * normal.
 *
 * @param {any} obj
 * @returns {cborg.Token[]|null}
 */
function cidEncoder (obj) {
  if (obj.asCID !== obj) {
    return null // any other kind of object
  }
  const cid = CID.asCID(obj)
  /* c8 ignore next 4 */
  // very unlikely case, and it'll probably throw a recursion error in cborg
  if (!cid) {
    return null
  }
  const bytes = new Uint8Array(cid.bytes.byteLength + 1)
  bytes.set(cid.bytes, 1) // prefix is 0x00, for historical reasons
  return [
    new cborg.Token(cborg.Type.tag, CID_CBOR_TAG),
    new cborg.Token(cborg.Type.bytes, bytes)
  ]
}

/**
 * Intercept all `undefined` values from an object walk and reject the entire
 * object if we find one.
 *
 * @returns {null}
 */
function undefinedEncoder () {
  throw new Error('`undefined` is not supported by the IPLD Data Model and cannot be encoded')
}

/**
 * Intercept all `number` values from an object walk and reject the entire
 * object if we find something that doesn't fit the IPLD data model (NaN &
 * Infinity).
 *
 * @param {number} num
 * @returns {null}
 */
function numberEncoder (num) {
  if (Number.isNaN(num)) {
    throw new Error('`NaN` is not supported by the IPLD Data Model and cannot be encoded')
  }
  if (num === Infinity || num === -Infinity) {
    throw new Error('`Infinity` and `-Infinity` is not supported by the IPLD Data Model and cannot be encoded')
  }
  return null
}

const encodeOptions = {
  float64: true,
  typeEncoders: {
    Object: cidEncoder,
    undefined: undefinedEncoder,
    number: numberEncoder
  }
}

/**
 * @param {Uint8Array} bytes
 * @returns {CID}
 */
function cidDecoder (bytes) {
  if (bytes[0] !== 0) {
    throw new Error('Invalid CID for CBOR tag 42; expected leading 0x00')
  }
  return CID.decode(bytes.subarray(1)) // ignore leading 0x00
}

const decodeOptions = {
  allowIndefinite: false,
  coerceUndefinedToNull: true,
  allowNaN: false,
  allowInfinity: false,
  allowBigInt: true, // this will lead to BigInt for ints outside of
  // safe-integer range, which may surprise users
  strict: true,
  useMaps: false,
  /** @type {import('cborg').TagDecoder[]} */
  tags: []
}
decodeOptions.tags[CID_CBOR_TAG] = cidDecoder

export const name = 'dag-cbor'
export const code = 0x71

/**
 * @template T
 * @param {T} node
 * @returns {ByteView<T>}
 */
export const encode = (node) => cborg.encode(node, encodeOptions)

/**
 * @template T
 * @param {ByteView<T>} data
 * @returns {T}
 */
export const decode = (data) => cborg.decode(data, decodeOptions)
