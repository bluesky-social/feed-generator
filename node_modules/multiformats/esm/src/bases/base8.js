import { rfc4648 } from './base.js';
export const base8 = rfc4648({
  prefix: '7',
  name: 'base8',
  alphabet: '01234567',
  bitsPerChar: 3
});