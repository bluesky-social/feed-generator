import { from } from './base.js';
import {
  fromString,
  toString
} from '../bytes.js';
export const identity = from({
  prefix: '\0',
  name: 'identity',
  encode: buf => toString(buf),
  decode: str => fromString(str)
});