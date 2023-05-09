import crypto from 'crypto';
import { from } from './hasher.js';
import { coerce } from '../bytes.js';
export const sha256 = from({
  name: 'sha2-256',
  code: 18,
  encode: input => coerce(crypto.createHash('sha256').update(input).digest())
});
export const sha512 = from({
  name: 'sha2-512',
  code: 19,
  encode: input => coerce(crypto.createHash('sha512').update(input).digest())
});