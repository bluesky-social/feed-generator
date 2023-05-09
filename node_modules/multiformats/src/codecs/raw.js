// @ts-check

import { coerce } from '../bytes.js'

/**
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */

export const name = 'raw'
export const code = 0x55

/**
 * @param {Uint8Array} node
 * @returns {ByteView<Uint8Array>}
 */
export const encode = (node) => coerce(node)

/**
 * @param {ByteView<Uint8Array>} data
 * @returns {Uint8Array}
 */
export const decode = (data) => coerce(data)
