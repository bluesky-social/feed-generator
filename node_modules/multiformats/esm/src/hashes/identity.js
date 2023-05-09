import { coerce } from '../bytes.js';
import * as Digest from './digest.js';
const code = 0;
const name = 'identity';
const encode = coerce;
const digest = input => Digest.create(code, encode(input));
export const identity = {
  code,
  name,
  encode,
  digest
};