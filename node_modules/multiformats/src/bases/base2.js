// @ts-check

import { rfc4648 } from './base.js'

export const base2 = rfc4648({
  prefix: '0',
  name: 'base2',
  alphabet: '01',
  bitsPerChar: 1
})
