// This is an unfortunate replacement for @sindresorhus/is that we need to
// re-implement for performance purposes. In particular the is.observable()
// check is expensive, and unnecessary for our purposes. The values returned
// are compatible with @sindresorhus/is, however.

const typeofs = [
  'string',
  'number',
  'bigint',
  'symbol'
]

const objectTypeNames = [
  'Function',
  'Generator',
  'AsyncGenerator',
  'GeneratorFunction',
  'AsyncGeneratorFunction',
  'AsyncFunction',
  'Observable',
  'Array',
  'Buffer',
  'Object',
  'RegExp',
  'Date',
  'Error',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'Promise',
  'URL',
  'HTMLElement',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array'
]

/**
 * @param {any} value
 * @returns {string}
 */
export function is (value) {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }
  if (value === true || value === false) {
    return 'boolean'
  }
  const typeOf = typeof value
  if (typeofs.includes(typeOf)) {
    return typeOf
  }
  /* c8 ignore next 4 */
  // not going to bother testing this, it's not going to be valid anyway
  if (typeOf === 'function') {
    return 'Function'
  }
  if (Array.isArray(value)) {
    return 'Array'
  }
  if (isBuffer(value)) {
    return 'Buffer'
  }
  const objectType = getObjectType(value)
  if (objectType) {
    return objectType
  }
  /* c8 ignore next */
  return 'Object'
}

/**
 * @param {any} value
 * @returns {boolean}
 */
function isBuffer (value) {
  return value && value.constructor && value.constructor.isBuffer && value.constructor.isBuffer.call(null, value)
}

/**
 * @param {any} value
 * @returns {string|undefined}
 */
function getObjectType (value) {
  const objectTypeName = Object.prototype.toString.call(value).slice(8, -1)
  if (objectTypeNames.includes(objectTypeName)) {
    return objectTypeName
  }
  /* c8 ignore next */
  return undefined
}
