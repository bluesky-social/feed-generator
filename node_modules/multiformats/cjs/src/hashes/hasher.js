'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var digest = require('./digest.js');

const from = ({name, code, encode}) => new Hasher(name, code, encode);
class Hasher {
  constructor(name, code, encode) {
    this.name = name;
    this.code = code;
    this.encode = encode;
  }
  digest(input) {
    if (input instanceof Uint8Array) {
      const result = this.encode(input);
      return result instanceof Uint8Array ? digest.create(this.code, result) : result.then(digest$1 => digest.create(this.code, digest$1));
    } else {
      throw Error('Unknown type, must be binary type');
    }
  }
}

exports.Hasher = Hasher;
exports.from = from;
