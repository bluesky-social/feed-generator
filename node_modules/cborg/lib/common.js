const decodeErrPrefix = 'CBOR decode error:'
const encodeErrPrefix = 'CBOR encode error:'

const uintMinorPrefixBytes = []
uintMinorPrefixBytes[23] = 1
uintMinorPrefixBytes[24] = 2
uintMinorPrefixBytes[25] = 3
uintMinorPrefixBytes[26] = 5
uintMinorPrefixBytes[27] = 9

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} need
 */
function assertEnoughData (data, pos, need) {
  if (data.length - pos < need) {
    throw new Error(`${decodeErrPrefix} not enough data for type`)
  }
}

export {
  decodeErrPrefix,
  encodeErrPrefix,
  uintMinorPrefixBytes,
  assertEnoughData
}
