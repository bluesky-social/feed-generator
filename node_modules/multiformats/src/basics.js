// @ts-check

import * as identityBase from './bases/identity.js'
import * as base2 from './bases/base2.js'
import * as base8 from './bases/base8.js'
import * as base10 from './bases/base10.js'
import * as base16 from './bases/base16.js'
import * as base32 from './bases/base32.js'
import * as base36 from './bases/base36.js'
import * as base58 from './bases/base58.js'
import * as base64 from './bases/base64.js'
import * as base256emoji from './bases/base256emoji.js'
import * as sha2 from './hashes/sha2.js'
import * as identity from './hashes/identity.js'

import * as raw from './codecs/raw.js'
import * as json from './codecs/json.js'

import { CID, hasher, digest, varint, bytes } from './index.js'

const bases = { ...identityBase, ...base2, ...base8, ...base10, ...base16, ...base32, ...base36, ...base58, ...base64, ...base256emoji }
const hashes = { ...sha2, ...identity }
const codecs = { raw, json }

export { CID, hasher, digest, varint, bytes, hashes, bases, codecs }
