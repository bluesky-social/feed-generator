const _globalReference = globalThis || window || self

export const webcrypto = _globalReference.crypto
