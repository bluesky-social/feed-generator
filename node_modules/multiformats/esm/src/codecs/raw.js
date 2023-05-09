import { coerce } from '../bytes.js';
export const name = 'raw';
export const code = 85;
export const encode = node => coerce(node);
export const decode = data => coerce(data);