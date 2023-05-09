// @ts-check

/**
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const name = 'json'
export const code = 0x0200

/**
 * @template T
 * @param {T} node
 * @returns {ByteView<T>}
 */
export const encode = (node) => textEncoder.encode(JSON.stringify(node))

/**
 * @template T
 * @param {ByteView<T>} data
 * @returns {T}
 */
export const decode = (data) => JSON.parse(textDecoder.decode(data))
