'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var encode = require('./encode.js');
var jump = require('./jump.js');

const cborEncoders = encode.makeCborEncoders();
const defaultEncodeOptions = {
  float64: false,
  quickEncodeToken: jump.quickEncodeToken
};
function encodedLength(data, options) {
  options = Object.assign({}, defaultEncodeOptions, options);
  options.mapSorter = undefined;
  const tokens = encode.objectToTokens(data, options);
  return tokensToLength(tokens, cborEncoders, options);
}
function tokensToLength(tokens, encoders = cborEncoders, options = defaultEncodeOptions) {
  if (Array.isArray(tokens)) {
    let len = 0;
    for (const token of tokens) {
      len += tokensToLength(token, encoders, options);
    }
    return len;
  } else {
    const encoder = encoders[tokens.type.major];
    if (encoder.encodedSize === undefined || typeof encoder.encodedSize !== 'function') {
      throw new Error(`Encoder for ${ tokens.type.name } does not have an encodedSize()`);
    }
    return encoder.encodedSize(tokens, options);
  }
}

exports.encodedLength = encodedLength;
exports.tokensToLength = tokensToLength;
