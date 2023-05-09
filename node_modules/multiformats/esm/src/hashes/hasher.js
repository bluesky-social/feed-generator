import * as Digest from './digest.js';
export const from = ({name, code, encode}) => new Hasher(name, code, encode);
export class Hasher {
  constructor(name, code, encode) {
    this.name = name;
    this.code = code;
    this.encode = encode;
  }
  digest(input) {
    if (input instanceof Uint8Array) {
      const result = this.encode(input);
      return result instanceof Uint8Array ? Digest.create(this.code, result) : result.then(digest => Digest.create(this.code, digest));
    } else {
      throw Error('Unknown type, must be binary type');
    }
  }
}