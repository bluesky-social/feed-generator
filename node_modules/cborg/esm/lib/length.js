import {
  makeCborEncoders,
  objectToTokens
} from './encode.js';
import { quickEncodeToken } from './jump.js';
const cborEncoders = makeCborEncoders();
const defaultEncodeOptions = {
  float64: false,
  quickEncodeToken
};
export function encodedLength(data, options) {
  options = Object.assign({}, defaultEncodeOptions, options);
  options.mapSorter = undefined;
  const tokens = objectToTokens(data, options);
  return tokensToLength(tokens, cborEncoders, options);
}
export function tokensToLength(tokens, encoders = cborEncoders, options = defaultEncodeOptions) {
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