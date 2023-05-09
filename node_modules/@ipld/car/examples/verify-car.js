#!/usr/bin/env node

// Example: verify a car file's block bytes match the reported CIDs and that
// they have round-tripishness.
// This example is overly verbose but illustrates some concepts involved in CAR
// files.

import fs from 'fs'
import { bytes, CID } from 'multiformats'
import { CarBlockIterator } from '@ipld/car/iterator'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'
import * as dagJson from '@ipld/dag-json'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'
import { from as hasher } from 'multiformats/hashes/hasher'
import { blake2b256 } from '@multiformats/blake2/blake2b'

const { toHex } = bytes

if (!process.argv[2]) {
  console.log('Usage: verify-car.js <path/to/car>')
  process.exit(1)
}

const codecs = {
  [dagCbor.code]: dagCbor,
  [dagPb.code]: dagPb,
  [dagJson.code]: dagJson,
  [raw.code]: raw,
  [json.code]: json
}

const hashes = {
  [sha256.code]: sha256,
  [blake2b256.code]: hasher(blake2b256)
}

async function run () {
  const inStream = fs.createReadStream(process.argv[2])
  const reader = await CarBlockIterator.fromIterable(inStream)
  let count = 0

  for await (const { bytes, cid } of reader) {
    // Verify step 1: is this a CID we know how to deal with?
    if (!codecs[cid.code]) {
      console.log(`Unexpected codec: 0x${cid.code.toString(16)}`)
      process.exit(1)
    }
    if (!hashes[cid.multihash.code]) {
      console.log(`Unexpected multihash code: 0x${cid.multihash.code.toString(16)}`)
      process.exit(1)
    }

    // Verify step 2: if we hash the bytes, do we get the same digest as reported by the CID?
    // Note that this step is sufficient if you just want to safely verify the CAR's reported CIDs
    const hash = await hashes[cid.multihash.code].digest(bytes)
    if (toHex(hash.digest) !== toHex(cid.multihash.digest)) {
      console.log(`\nMismatch: digest of bytes (${toHex(hash)}) does not match digest in CID (${toHex(cid.multihash.digest)})`)
    }

    // Verify step 3: Can we round-trip the object and get the same CID for the re-encoded bytes?
    // Note that this step is rarely useful and may be over-kill in most cases of "verification"
    const obj = codecs[cid.code].decode(bytes)
    const reenc = codecs[cid.code].encode(obj)
    const rehash = await hashes[cid.multihash.code].digest(reenc)
    const recid = CID.create(cid.version, cid.code, rehash)
    if (!recid.equals(cid)) {
      console.log(`\nMismatch: ${cid} <> ${recid}`)
      console.log(`Orig:\n${toHex(bytes)}\nRe-encode:\n${toHex(reenc)}`)
    }

    if (++count % 100 === 0) {
      process.stdout.write('.')
    }
  }
  if (count > 100) {
    console.log()
  }
  console.log(`Verified ${count} block(s) in ${process.argv[2]}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
