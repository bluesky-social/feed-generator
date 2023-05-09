// @ts-check

import { from } from './base.js'
import { fromString, toString } from '../bytes.js'

export const identity = from({
  prefix: '\x00',
  name: 'identity',
  encode: (buf) => toString(buf),
  decode: (str) => fromString(str)
})
