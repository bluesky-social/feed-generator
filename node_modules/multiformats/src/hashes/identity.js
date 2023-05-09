import { coerce } from '../bytes.js'
import * as Digest from './digest.js'

const code = 0x0
const name = 'identity'

/** @type {(input:Uint8Array) => Uint8Array} */
const encode = coerce

/**
 * @param {Uint8Array} input
 * @returns {Digest.Digest<typeof code, number>}
 */
const digest = (input) => Digest.create(code, encode(input))

export const identity = { code, name, encode, digest }
