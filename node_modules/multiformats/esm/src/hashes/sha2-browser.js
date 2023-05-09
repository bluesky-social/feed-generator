import { from } from './hasher.js';
const sha = name => async data => new Uint8Array(await crypto.subtle.digest(name, data));
export const sha256 = from({
  name: 'sha2-256',
  code: 18,
  encode: sha('SHA-256')
});
export const sha512 = from({
  name: 'sha2-512',
  code: 19,
  encode: sha('SHA-512')
});