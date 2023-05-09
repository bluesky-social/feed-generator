/* global crypto */

import { from } from './hasher.js'

/**
 * @param {AlgorithmIdentifier} name
 */
const sha = name =>
  /**
   * @param {Uint8Array} data
   */
  async data => new Uint8Array(await crypto.subtle.digest(name, data))

export const sha256 = from({
  name: 'sha2-256',
  code: 0x12,
  encode: sha('SHA-256')
})

export const sha512 = from({
  name: 'sha2-512',
  code: 0x13,
  encode: sha('SHA-512')
})
