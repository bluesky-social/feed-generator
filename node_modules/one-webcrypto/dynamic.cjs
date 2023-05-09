const _globalReference = globalThis || window || self

module.exports = {
    // check the environment dynamically
    webcrypto: _globalReference.crypto != null ? _globalReference.crypto : require('crypto').webcrypto
}
