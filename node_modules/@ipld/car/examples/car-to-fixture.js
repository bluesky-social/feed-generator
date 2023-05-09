#!/usr/bin/env node

// Take a .car file and dump its contents to stdout as a single DAG-JSON format
// block. The format is standardised for describing CAR fixtures at
// https://ipld.io/specs/transport/car/fixture/

import fs from 'fs'
import { CarReader } from '@ipld/car/reader'
import { CarIndexer } from '@ipld/car/indexer'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'
import * as dagJson from '@ipld/dag-json'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'

if (!process.argv[2]) {
  console.log('Usage: dump-car.js <path/to/car>')
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
  const bytes = await fs.promises.readFile(process.argv[2])
  // this is not the most optimal way to get both an index and a reader,
  // nor is reading in the bytes into memory necessarily the best thing
  // to be doing, but this is fine for small files and where efficiency
  // isn't critical
  const indexer = await CarIndexer.fromBytes(bytes)
  const reader = await CarReader.fromBytes(bytes)
  const fixture = {
    header: {
      roots: await reader.getRoots(),
      version: reader.version
    },
    blocks: []
  }
  let i = 0
  for await (const blockIndex of indexer) {
    fixture.blocks[i] = blockIndex
    const block = await reader.get(blockIndex.cid)
    fixture.blocks[i].content = decode(blockIndex.cid, block.bytes)
    i++
  }
  const json = new TextDecoder().decode(dagJson.encode(fixture))
  if (process.argv.includes('--pretty')) {
    console.log(JSON.stringify(JSON.parse(json), null, 2))
  } else {
    console.log(json)
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
