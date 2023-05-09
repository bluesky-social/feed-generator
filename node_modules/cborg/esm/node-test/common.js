import {
  Token,
  Type
} from '../lib/token.js';
export function dateDecoder(obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 1');
  }
  return new Date(obj);
}
export function dateEncoder(obj) {
  if (!(obj instanceof Date)) {
    throw new Error('expected Date for "Date" encoder');
  }
  return [
    new Token(Type.tag, 0),
    new Token(Type.string, obj.toISOString().replace(/\.000Z$/, 'Z'))
  ];
}