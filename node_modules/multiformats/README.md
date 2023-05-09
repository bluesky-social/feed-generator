# multiformats

* [Interfaces](#interfaces)
  * [Creating Blocks](#creating-blocks)
  * [Multibase Encoders / Decoders / Codecs](#multibase-encoders--decoders--codecs)
  * [Multicodec Encoders / Decoders / Codecs](#multicodec-encoders--decoders--codecs)
  * [Multihash Hashers](#multihash-hashers)
  * [Traversal](#traversal)
* [Legacy interface](#legacy-interface)
* [Implementations](#implementations)
  * [Multibase codecs](#multibase-codecs)
  * [Multihash hashers](#multihash-hashers-1)
  * [IPLD codecs (multicodec)](#ipld-codecs-multicodec)
* [License](#license)
  * [Contribution](#contribution)

This library defines common interfaces and low level building blocks for various interrelated multiformat technologies (multicodec, multihash, multibase, and CID). They can be used to implement custom base encoders / decoders / codecs, codec encoders /decoders and multihash hashers that comply to the interface that layers above assume.

This library provides implementations for most basics and many others can be found in linked repositories.

## Interfaces

```js
import { CID } from 'multiformats/cid'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

const bytes = json.encode({ hello: 'world' })

const hash = await sha256.digest(bytes)
const cid = CID.create(1, json.code, hash)
//> CID(bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea)
```

### Creating Blocks

```js
import * as Block from 'multiformats/block'
import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'

const value = { hello: 'world' }

// encode a block
let block = await Block.encode({ value, codec, hasher })

block.value // { hello: 'world' }
block.bytes // Uint8Array
block.cid   // CID() w/ sha2-256 hash address and dag-cbor codec

// you can also decode blocks from their binary state
block = await Block.decode({ bytes: block.bytes, codec, hasher })

// if you have the cid you can also verify the hash on decode
block = await Block.create({ bytes: block.bytes, cid: block.cid, codec, hasher })
```

### Multibase Encoders / Decoders / Codecs

CIDs can be serialized to string representation using multibase encoders that implement [`MultibaseEncoder`](https://github.com/multiformats/js-multiformats/blob/master/src/bases/interface.ts) interface. This library provides quite a few implementations that can be imported:

```js
import { base64 } from "multiformats/bases/base64"
cid.toString(base64.encoder)
//> 'mAYAEEiCTojlxqRTl6svwqNJRVM2jCcPBxy+7mRTUfGDzy2gViA'
```

Parsing CID string serialized CIDs requires multibase decoder that implements [`MultibaseDecoder`](https://github.com/multiformats/js-multiformats/blob/master/src/bases/interface.ts) interface. This library provides a decoder for every encoder it provides:

```js
CID.parse('mAYAEEiCTojlxqRTl6svwqNJRVM2jCcPBxy+7mRTUfGDzy2gViA', base64.decoder)
//> CID(bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea)
```

Dual of multibase encoder & decoder is defined as multibase codec and it exposes
them as `encoder` and `decoder` properties. For added convenience codecs also
implement `MultibaseEncoder` and `MultibaseDecoder` interfaces so they could be
used as either or both:


```js
cid.toString(base64)
CID.parse(cid.toString(base64), base64)
```

**Note:** CID implementation comes bundled with `base32` and `base58btc`
multibase codecs so that CIDs can be base serialized to (version specific)
default base encoding and parsed without having to supply base encoders/decoders:

```js
const v1 = CID.parse('bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea')
v1.toString()
//> 'bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea'

const v0 = CID.parse('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n')
v0.toString()
//> 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
v0.toV1().toString()
//> 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku'
```

### Multicodec Encoders / Decoders / Codecs

This library defines [`BlockEncoder`, `BlockDecoder` and `BlockCodec` interfaces](https://github.com/multiformats/js-multiformats/blob/master/src/codecs/interface.ts).
Codec implementations should conform to the `BlockCodec` interface which implements both `BlockEncoder` and `BlockDecoder`.
Here is an example implementation of JSON `BlockCodec`.

```js
/**
 * @template T
 * @type {BlockCodec<0x0200, T>}
 */
export const { name, code, encode, decode } = {
  name: 'json',
  code: 0x0200,
  encode: json => new TextEncoder().encode(JSON.stringify(json)),
  decode: bytes => JSON.parse(new TextDecoder().decode(bytes))
}
```

### Multihash Hashers

This library defines [`MultihashHasher` and `MultihashDigest` interfaces](https://github.com/multiformats/js-multiformats/blob/master/src/hashes/interface.ts) and convinient function for implementing them:

```js
import * as hasher from 'multiformats/hashes/hasher'

const sha256 = hasher.from({
  // As per multiformats table
  // https://github.com/multiformats/multicodec/blob/master/table.csv#L9
  name: 'sha2-256',
  code: 0x12,

  encode: (input) => new Uint8Array(crypto.createHash('sha256').update(input).digest())
})

const hash = await sha256.digest(json.encode({ hello: 'world' }))
CID.create(1, json.code, hash)

//> CID(bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea)
```

### Traversal

This library contains higher-order functions for traversing graphs of data easily.

`walk()` walks through the links in each block of a DAG calling a user-supplied loader function for each one, in depth-first order with no duplicate block visits. The loader should return a `Block` object and can be used to inspect and collect block ordering for a full DAG walk. The loader should `throw` on error, and return `null` if a block should be skipped by `walk()`.

```js
import { walk } from 'multiformats/traversal'
import * as Block from 'multiformats/block'
import * as codec from 'multiformats/codecs/json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'

// build a DAG (a single block for this simple example)
const value = { hello: 'world' }
const block = await Block.encode({ value, codec, hasher })
const { cid } = block
console.log(cid)
//> CID(bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea)

// create a loader function that also collects CIDs of blocks in
// their traversal order
const load = (cid, blocks) => async (cid) => {
  // fetch a block using its cid
  // e.g.: const block = await fetchBlockByCID(cid)
  blocks.push(cid)
  return block
}

// collect blocks in this DAG starting from the root `cid`
const blocks = []
await walk({ cid, load: load(cid, blocks) })

console.log(blocks)
//> [CID(bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea)]
```

## Legacy interface

[`blockcodec-to-ipld-format`](https://github.com/ipld/js-blockcodec-to-ipld-format) converts a multiformats [`BlockCodec`](https://github.com/multiformats/js-multiformats/blob/master/src/codecs/interface.ts#L21) into an
[`interface-ipld-format`](https://github.com/ipld/interface-ipld-format) for use with the [`ipld`](https://github.com/ipld/ipld) package. This can help bridge IPLD codecs implemented using the structure and interfaces defined here to existing code that assumes, or requires `interface-ipld-format`. This bridge also includes the relevant TypeScript definitions.

## Implementations

By default, no base encodings (other than base32 & base58btc), hash functions,
or codec implementations are exposed by `multiformats`, you need to
import the ones you need yourself.

### Multibase codecs

| bases | import | repo |
 --- | --- | --- |
`base16` | `multiformats/bases/base16` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |
`base32`, `base32pad`, `base32hex`, `base32hexpad`, `base32z` | `multiformats/bases/base32` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |
`base64`, `base64pad`, `base64url`, `base64urlpad` | `multiformats/bases/base64` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |
`base58btc`, `base58flick4` | `multiformats/bases/base58` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |

Other (less useful) bases implemented in [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) include: `base2`, `base8`, `base10`, `base36` and `base256emoji`.

### Multihash hashers

| hashes | import | repo |
| --- | --- | --- |
| `sha2-256`, `sha2-512` | `multiformats/hashes/sha2` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/src/hashes) |
| `sha3-224`, `sha3-256`, `sha3-384`,`sha3-512`, `shake-128`, `shake-256`, `keccak-224`, `keccak-256`, `keccak-384`, `keccak-512` | `@multiformats/sha3` | [multiformats/js-sha3](https://github.com/multiformats/js-sha3) |
| `identity` | `multiformats/hashes/identity` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/src/hashes/identity.js) |
| `murmur3-128`, `murmur3-32` | `@multiformats/murmur3` | [multiformats/js-murmur3](https://github.com/multiformats/js-murmur3) |
| `blake2b-*`, `blake2s-*` | `@multiformats/blake2` | [multiformats/js-blake2](https://github.com/multiformats/js-blake2) |

### IPLD codecs (multicodec)

| codec | import | repo |
| --- | --- | --- |
| `raw` | `multiformats/codecs/raw` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/src/codecs) |
| `json` | `multiformats/codecs/json` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/src/codecs) |
| `dag-cbor` | `@ipld/dag-cbor` | [ipld/js-dag-cbor](https://github.com/ipld/js-dag-cbor) |
| `dag-json` | `@ipld/dag-json` | [ipld/js-dag-json](https://github.com/ipld/js-dag-json) |
| `dag-pb` | `@ipld/dag-pb` | [ipld/js-dag-pb](https://github.com/ipld/js-dag-pb) |
| `dag-jose` | `dag-jose`| [ceramicnetwork/js-dag-jose](https://github.com/ceramicnetwork/js-dag-jose) |

## License

Licensed under either of

 * Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / http://www.apache.org/licenses/LICENSE-2.0)
 * MIT ([LICENSE-MIT](LICENSE-MIT) / http://opensource.org/licenses/MIT)

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
