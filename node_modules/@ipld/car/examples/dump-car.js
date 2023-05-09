#!/usr/bin/env node

// Take a .car file and dump its contents into one file per block, with the
// filename being the CID of that block.
// Also prints a DAG-JSON form of the block and its CID to stdout.
// If `--inspect` is supplied, don't write the blocks, just print them to stdout.

import fs from 'fs'
import { CarBlockIterator } from '@ipld/car/iterator'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'
import * as dagJson from '@ipld/dag-json'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'

if (!process.argv[2]) {
  console.log('Usage: dump-car.js [--inspect] <path/to/car>')
  process.exit(1)
}

const codecs = {
  [dagCbor.code]: dagCbor,
  [dagPb.code]: dagPb,
  [dagJson.code]: dagJson,
  [raw.code]: raw,
  [json.code]: json
}

function decode (cid, bytes) {
  if (!codecs[cid.code]) {
    throw new Error(`Unknown codec code: 0x${cid.code.toString(16)}`)
  }
  return codecs[cid.code].decode(bytes)
}

async function run () {
  const inspect = process.argv.includes('--inspect')
  const inStream = fs.createReadStream(process.argv.filter((a) => a !== '--inspect')[2])
  const reader = await CarBlockIterator.fromIterable(inStream)
  console.log(`Version: ${reader.version}`)
  console.log(`Roots: [${(await reader.getRoots()).map((r) => r.toString()).join(', ')}]`)
  console.log('Blocks:')
  let i = 1
  for await (const { cid, bytes } of reader) {
    if (!inspect) {
      await fs.promises.writeFile(cid.toString(), bytes)
    }

    const decoded = decode(cid, bytes)
    console.log(`#${i++} ${cid} [${codecs[cid.code].name}]`)
    console.dir(new TextDecoder().decode(dagJson.encode(decoded)))
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
