# @ipld/car

A JavaScript Content Addressable aRchive (CAR) file reader and writer.

See also:

 * Original [Go implementation](https://github.com/ipfs/go-car)
 * [CAR specification](https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md)
 * [IPLD](https://ipld.io)
 

## Contents

 * [Example](#example)
 * [Usage](#usage)
 * [API](#api)
 * [License](#license)

## Example

```js
// Create a simple .car file with a single block and that block's CID as the
// single root. Then read the .car and fetch the block again.

import fs from 'fs'
import { Readable } from 'stream'
import { CarReader, CarWriter } from '@ipld/car'
import * as raw from 'multiformats/codecs/raw'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

async function example () {
  const bytes = new TextEncoder().encode('random meaningless bytes')
  const hash = await sha256.digest(raw.encode(bytes))
  const cid = CID.create(1, raw.code, hash)

  // create the writer and set the header with a single root
  const { writer, out } = await CarWriter.create([cid])
  Readable.from(out).pipe(fs.createWriteStream('example.car'))

  // store a new block, creates a new file entry in the CAR archive
  await writer.put({ cid, bytes })
  await writer.close()

  const inStream = fs.createReadStream('example.car')
  // read and parse the entire stream in one go, this will cache the contents of
  // the car in memory so is not suitable for large files.
  const reader = await CarReader.fromIterable(inStream)

  // read the list of roots from the header
  const roots = await reader.getRoots()
  // retrieve a block, as a { cid:CID, bytes:UInt8Array } pair from the archive
  const got = await reader.get(roots[0])
  // also possible: for await (const { cid, bytes } of CarIterator.fromIterable(inStream)) { ... }

  console.log('Retrieved [%s] from example.car with CID [%s]',
    new TextDecoder().decode(got.bytes),
    roots[0].toString())
}

example().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Will output:

```
Retrieved [random meaningless bytes] from example.car with CID [bafkreihwkf6mtnjobdqrkiksr7qhp6tiiqywux64aylunbvmfhzeql2coa]
```

See the [examples](./examples) directory for more.

## Usage

`@ipld/car` is consumed through factory methods on its different classes. Each
class represents a discrete set of functionality. You should select the classes
that make the most sense for your use-case.

Please be aware that `@ipld/car` **does not validate** that block data matches
the paired CIDs when reading a CAR. See the
[verify-car.js](./examples/verify-car.js) example for one possible approach to
validating blocks as they are read. Any CID verification requires that the hash
function that was used to generate the CID be available, the CAR format does
not restrict the allowable multihashes.

### [`CarReader`](#CarReader)

The basic `CarReader` class is consumed via:

```js
import { CarReader } from '@ipld/car/reader'
```

Or alternatively: `import { CarReader } from '@ipld/car'`. CommonJS `require`
will also work for the same import paths and references.

`CarReader` is useful for relatively small CAR archives as it buffers the
entirety of the archive in memory to provide access to its data. This class is
also suitable in a browser environment. The `CarReader` class provides
random-access [`get(key)`](#CarReader_get) and  [`has(key)`](#CarReader_has)
methods as well as iterators for [`blocks()`](#CarReader_blocks)] and
[`cids()`](#CarReader_cids)].

`CarReader` can be instantiated from a
[single `Uint8Array`](#CarReader__fromBytes) or from
[an `AsyncIterable`](#CarReader__fromIterable) of `Uint8Array`s (note that
Node.js streams are `AsyncIterable`s and can be consumed in this way).

### [`CarIndexedReader`](#CarIndexedReader)

The `CarIndexedReader` class is a special form of `CarReader` and can be
consumed in **Node.js only** (not in the browser) via:

```js
import { CarIndexedReader } from '@ipld/car/indexed-reader'
```

Or alternatively: `import { CarIndexedReader } from '@ipld/car'`. CommonJS
`require` will also work for the same import paths and references.

A `CarIndexedReader` provides the same functionality as `CarReader` but is
instantiated from [a path to a CAR file](#CarIndexedReader__fromFile) and also
adds a [`close()`](#CarWriter_close) method that must be called when the reader
is no longer required, to clean up resources.

`CarIndexedReader` performs a single full-scan of a CAR file, collecting a list
of `CID`s and their block positions in the archive. It then performs
random-access reads when blocks are requested via `get()` and the `blocks()` and
`cids()` iterators.

This class may be sutiable for random-access (primarily via `has()` and `get()`)
to relatively large CAR files.

### [`CarBlockIterator`](#CarBlockIterator) and [`CarCIDIterator`](#CarCIDIterator)

```js
import { CarBlockIterator } from '@ipld/car/iterator'
// or
import { CarCIDIterator } from '@ipld/car/iterator'
```

Or alternatively:
`import { CarBlockIterator, CarCIDIterator } from '@ipld/car'`. CommonJS
`require` will also work for the same import paths and references.

These two classes provide `AsyncIterable`s to the blocks or just the `CIDs`
contained within a CAR archive. These are efficient mechanisms for scanning an
entire CAR archive, regardless of size, if random-access to blocks is not
required.

`CarBlockIterator` and `CarCIDIterator` can be instantiated from a
single `Uint8Array` (see
[`CarBlockIterator.fromBytes()`](#CarBlockIterator__fromBytes) and
[`CarCIDIterator.fromBytes()`](#CarCIDIterator__fromBytes)) or from
an `AsyncIterable` of `Uint8Array`s (see
[`CarBlockIterator.fromIterable()`](#CarBlockIterator__fromIterable) and
[`CarCIDIterator.fromIterable()`](#CarCIDIterator__fromIterable))—note that
Node.js streams are `AsyncIterable`s and can be consumed in this way.

### [`CarIndexer`](#CarIndexer)

The `CarIndexer` class can be used to scan a CAR archive and provide indexing
data on the contents. It can be consumed via:

```js
import CarIndexer from '@ipld/car/indexed-reader'
```

Or alternatively: `import { CarIndexer } from '@ipld/car'`. CommonJS
`require` will also work for the same import paths and references.

This class is used within [`CarIndexedReader`](#CarIndexedReader) and is only
useful in cases where an external index of a CAR needs to be generated and used.

The index data can also be used with
[`CarReader.readRaw()`](#CarReader__readRaw)] to fetch block data directly from
a file descriptor using the index data for that block.

### [`CarWriter`](#CarWriter)

A `CarWriter` is used to create new CAR archives. It can be consumed via:

```js
import CarWriter from '@ipld/car/writer'
```

Or alternatively: `import { CarWriter } from '@ipld/car'`. CommonJS
`require` will also work for the same import paths and references.

[Creation of a `CarWriter`](#CarWriter__create) involves a "channel", or a
`{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair. The `writer` side
of the channel is used to [`put()`](#CarWriter_put) blocks, while the `out`
side of the channel emits the bytes that form the encoded CAR archive.

In Node.js, you can use the
[`Readable.from()`](https://nodejs.org/api/stream.html#stream_stream_readable_from_iterable_options)
API to convert the `out` `AsyncIterable` to a standard Node.js stream, or it can
be directly fed to a
[`stream.pipeline()`](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback).

## API

### Contents

 * [`class CarReader`](#CarReader)
 * [`async CarReader#getRoots()`](#CarReader_getRoots)
 * [`async CarReader#has(key)`](#CarReader_has)
 * [`async CarReader#get(key)`](#CarReader_get)
 * [`async * CarReader#blocks()`](#CarReader_blocks)
 * [`async * CarReader#cids()`](#CarReader_cids)
 * [`async CarReader.fromBytes(bytes)`](#CarReader__fromBytes)
 * [`async CarReader.fromIterable(asyncIterable)`](#CarReader__fromIterable)
 * [`async CarReader.readRaw(fd, blockIndex)`](#CarReader__readRaw)
 * [`class CarIndexedReader`](#CarIndexedReader)
 * [`async CarIndexedReader#getRoots()`](#CarIndexedReader_getRoots)
 * [`async CarIndexedReader#has(key)`](#CarIndexedReader_has)
 * [`async CarIndexedReader#get(key)`](#CarIndexedReader_get)
 * [`async * CarIndexedReader#blocks()`](#CarIndexedReader_blocks)
 * [`async * CarIndexedReader#cids()`](#CarIndexedReader_cids)
 * [`async CarIndexedReader#close()`](#CarIndexedReader_close)
 * [`async CarIndexedReader.fromFile(path)`](#CarIndexedReader__fromFile)
 * [`class CarBlockIterator`](#CarBlockIterator)
 * [`async CarBlockIterator#getRoots()`](#CarBlockIterator_getRoots)
 * [`async CarBlockIterator.fromBytes(bytes)`](#CarBlockIterator__fromBytes)
 * [`async CarBlockIterator.fromIterable(asyncIterable)`](#CarBlockIterator__fromIterable)
 * [`class CarCIDIterator`](#CarCIDIterator)
 * [`async CarCIDIterator#getRoots()`](#CarCIDIterator_getRoots)
 * [`async CarCIDIterator.fromBytes(bytes)`](#CarCIDIterator__fromBytes)
 * [`async CarCIDIterator.fromIterable(asyncIterable)`](#CarCIDIterator__fromIterable)
 * [`class CarIndexer`](#CarIndexer)
 * [`async CarIndexer#getRoots()`](#CarIndexer_getRoots)
 * [`async CarIndexer.fromBytes(bytes)`](#CarIndexer__fromBytes)
 * [`async CarIndexer.fromIterable(asyncIterable)`](#CarIndexer__fromIterable)
 * [`class CarWriter`](#CarWriter)
 * [`async CarWriter#put(block)`](#CarWriter_put)
 * [`async CarWriter#close()`](#CarWriter_close)
 * [`async CarWriter.create(roots)`](#CarWriter__create)
 * [`async CarWriter.createAppender()`](#CarWriter__createAppender)
 * [`async CarWriter.updateRootsInBytes(bytes, roots)`](#CarWriter__updateRootsInBytes)
 * [`async CarWriter.updateRootsInFile(fd, roots)`](#CarWriter__updateRootsInFile)

<a name="CarReader"></a>
### `class CarReader`

Properties:

* `version` `(number)`: The version number of the CAR referenced by this
  reader (should be `1`).

Provides blockstore-like access to a CAR.

Implements the `RootsReader` interface:
[`getRoots()`](#CarReader__getRoots). And the `BlockReader` interface:
[`get()`](#CarReader__get), [`has()`](#CarReader__has),
[`blocks()`](#CarReader__blocks) (defined as a `BlockIterator`) and
[`cids()`](#CarReader__cids) (defined as a `CIDIterator`).

Load this class with either `import { CarReader } from '@ipld/car/reader'`
(`const { CarReader } = require('@ipld/car/reader')`). Or
`import { CarReader } from '@ipld/car'` (`const { CarReader } = require('@ipld/car')`).
The former will likely result in smaller bundle sizes where this is
important.

<a name="CarReader_getRoots"></a>
### `async CarReader#getRoots()`

* Returns:  `Promise<CID[]>`

Get the list of roots defined by the CAR referenced by this reader. May be
zero or more `CID`s.

<a name="CarReader_has"></a>
### `async CarReader#has(key)`

* `key` `(CID)`

* Returns:  `Promise<boolean>`

Check whether a given `CID` exists within the CAR referenced by this
reader.

<a name="CarReader_get"></a>
### `async CarReader#get(key)`

* `key` `(CID)`

* Returns:  `Promise<(Block|undefined)>`

Fetch a `Block` (a `{ cid:CID, bytes:Uint8Array }` pair) from the CAR
referenced by this reader matching the provided `CID`. In the case where
the provided `CID` doesn't exist within the CAR, `undefined` will be
returned.

<a name="CarReader_blocks"></a>
### `async * CarReader#blocks()`

* Returns:  `AsyncGenerator<Block>`

Returns a `BlockIterator` (`AsyncIterable<Block>`) that iterates over all
of the `Block`s (`{ cid:CID, bytes:Uint8Array }` pairs) contained within
the CAR referenced by this reader.

<a name="CarReader_cids"></a>
### `async * CarReader#cids()`

* Returns:  `AsyncGenerator<CID>`

Returns a `CIDIterator` (`AsyncIterable<CID>`) that iterates over all of
the `CID`s contained within the CAR referenced by this reader.

<a name="CarReader__fromBytes"></a>
### `async CarReader.fromBytes(bytes)`

* `bytes` `(Uint8Array)`

* Returns:  `Promise<CarReader>`: blip blop

Instantiate a [`CarReader`](#CarReader) from a `Uint8Array` blob. This performs a
decode fully in memory and maintains the decoded state in memory for full
access to the data via the `CarReader` API.

<a name="CarReader__fromIterable"></a>
### `async CarReader.fromIterable(asyncIterable)`

* `asyncIterable` `(AsyncIterable<Uint8Array>)`

* Returns:  `Promise<CarReader>`

Instantiate a [`CarReader`](#CarReader) from a `AsyncIterable<Uint8Array>`, such as
a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
This performs a decode fully in memory and maintains the decoded state in
memory for full access to the data via the `CarReader` API.

Care should be taken for large archives; this API may not be appropriate
where memory is a concern or the archive is potentially larger than the
amount of memory that the runtime can handle.

<a name="CarReader__readRaw"></a>
### `async CarReader.readRaw(fd, blockIndex)`

* `fd` `(fs.promises.FileHandle|number)`: A file descriptor from the
  Node.js `fs` module. Either an integer, from `fs.open()` or a `FileHandle`
  from `fs.promises.open()`.
* `blockIndex` `(BlockIndex)`: An index pointing to the location of the
  Block required. This `BlockIndex` should take the form:
  `{cid:CID, blockLength:number, blockOffset:number}`.

* Returns:  `Promise<Block>`: A `{ cid:CID, bytes:Uint8Array }` pair.

Reads a block directly from a file descriptor for an open CAR file. This
function is **only available in Node.js** and not a browser environment.

This function can be used in connection with [`CarIndexer`](#CarIndexer) which emits
the `BlockIndex` objects that are required by this function.

The user is responsible for opening and closing the file used in this call.

<a name="CarIndexedReader"></a>
### `class CarIndexedReader`

Properties:

* `version` `(number)`: The version number of the CAR referenced by this
  reader (should be `1`).

A form of [`CarReader`](#CarReader) that pre-indexes a CAR archive from a file and
provides random access to blocks within the file using the index data. This
function is **only available in Node.js** and not a browser environment.

For large CAR files, using this form of `CarReader` can be singificantly more
efficient in terms of memory. The index consists of a list of `CID`s and
their location within the archive (see [`CarIndexer`](#CarIndexer)). For large numbers
of blocks, this index can also occupy a significant amount of memory. In some
cases it may be necessary to expand the memory capacity of a Node.js instance
to allow this index to fit. (e.g. by running with
`NODE_OPTIONS="--max-old-space-size=16384"`).

As an `CarIndexedReader` instance maintains an open file descriptor for its
CAR file, an additional [`CarReader#close`](#CarReader_close) method is attached. This
_must_ be called to have full clean-up of resources after use.

Load this class with either
`import { CarIndexedReader } from '@ipld/car/indexed-reader'`
(`const { CarIndexedReader } = require('@ipld/car/indexed-reader')`). Or
`import { CarIndexedReader } from '@ipld/car'`
(`const { CarIndexedReader } = require('@ipld/car')`). The former will likely
result in smaller bundle sizes where this is important.

<a name="CarIndexedReader_getRoots"></a>
### `async CarIndexedReader#getRoots()`

* Returns:  `Promise<CID[]>`

See [`CarReader#getRoots`](#CarReader_getRoots)

<a name="CarIndexedReader_has"></a>
### `async CarIndexedReader#has(key)`

* `key` `(CID)`

* Returns:  `Promise<boolean>`

See [`CarReader#has`](#CarReader_has)

<a name="CarIndexedReader_get"></a>
### `async CarIndexedReader#get(key)`

* `key` `(CID)`

* Returns:  `Promise<(Block|undefined)>`

See [`CarReader#get`](#CarReader_get)

<a name="CarIndexedReader_blocks"></a>
### `async * CarIndexedReader#blocks()`

* Returns:  `AsyncGenerator<Block>`

See [`CarReader#blocks`](#CarReader_blocks)

<a name="CarIndexedReader_cids"></a>
### `async * CarIndexedReader#cids()`

* Returns:  `AsyncGenerator<CID>`

See [`CarReader#cids`](#CarReader_cids)

<a name="CarIndexedReader_close"></a>
### `async CarIndexedReader#close()`

* Returns:  `Promise<void>`

Close the underlying file descriptor maintained by this `CarIndexedReader`.
This must be called for proper resource clean-up to occur.

<a name="CarIndexedReader__fromFile"></a>
### `async CarIndexedReader.fromFile(path)`

* `path` `(string)`

* Returns:  `Promise<CarIndexedReader>`

Instantiate an [`CarIndexedReader`](#CarIndexedReader) from a file with the provided
`path`. The CAR file is first indexed with a full path that collects `CID`s
and block locations. This index is maintained in memory. Subsequent reads
operate on a read-only file descriptor, fetching the block from its in-file
location.

For large archives, the initial indexing may take some time. The returned
`Promise` will resolve only after this is complete.

<a name="CarBlockIterator"></a>
### `class CarBlockIterator`

Properties:

* `version` `(number)`: The version number of the CAR referenced by this
  iterator (should be `1`).

Provides an iterator over all of the `Block`s in a CAR. Implements a
`BlockIterator` interface, or `AsyncIterable<Block>`. Where a `Block` is
a `{ cid:CID, bytes:Uint8Array }` pair.

As an implementer of `AsyncIterable`, this class can be used directly in a
`for await (const block of iterator) {}` loop. Where the `iterator` is
constructed using [`CarBlockiterator.fromBytes`](#CarBlockiterator__fromBytes) or
[`CarBlockiterator.fromIterable`](#CarBlockiterator__fromIterable).

An iteration can only be performce _once_ per instantiation.

`CarBlockIterator` also implements the `RootsReader` interface and provides
the [`getRoots()`](#CarBlockiterator__getRoots) method.

Load this class with either
`import { CarBlockIterator } from '@ipld/car/iterator'`
(`const { CarBlockIterator } = require('@ipld/car/iterator')`). Or
`import { CarBlockIterator } from '@ipld/car'`
(`const { CarBlockIterator } = require('@ipld/car')`).

<a name="CarBlockIterator_getRoots"></a>
### `async CarBlockIterator#getRoots()`

* Returns:  `Promise<CID[]>`

Get the list of roots defined by the CAR referenced by this iterator. May be
zero or more `CID`s.

<a name="CarBlockIterator__fromBytes"></a>
### `async CarBlockIterator.fromBytes(bytes)`

* `bytes` `(Uint8Array)`

* Returns:  `Promise<CarBlockIterator>`

Instantiate a [`CarBlockIterator`](#CarBlockIterator) from a `Uint8Array` blob. Rather
than decoding the entire byte array prior to returning the iterator, as in
[`CarReader.fromBytes`](#CarReader__fromBytes), only the header is decoded and the remainder
of the CAR is parsed as the `Block`s as yielded.

<a name="CarBlockIterator__fromIterable"></a>
### `async CarBlockIterator.fromIterable(asyncIterable)`

* `asyncIterable` `(AsyncIterable<Uint8Array>)`

* Returns:  `Promise<CarBlockIterator>`

Instantiate a [`CarBlockIterator`](#CarBlockIterator) from a `AsyncIterable<Uint8Array>`,
such as a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
Rather than decoding the entire byte array prior to returning the iterator,
as in [`CarReader.fromIterable`](#CarReader__fromIterable), only the header is decoded and the
remainder of the CAR is parsed as the `Block`s as yielded.

<a name="CarCIDIterator"></a>
### `class CarCIDIterator`

Properties:

* `version` `(number)`: The version number of the CAR referenced by this
  iterator (should be `1`).

Provides an iterator over all of the `CID`s in a CAR. Implements a
`CIDIterator` interface, or `AsyncIterable<CID>`. Similar to
[`CarBlockIterator`](#CarBlockIterator) but only yields the CIDs in the CAR.

As an implementer of `AsyncIterable`, this class can be used directly in a
`for await (const cid of iterator) {}` loop. Where the `iterator` is
constructed using [`CarCIDiterator.fromBytes`](#CarCIDiterator__fromBytes) or
[`CarCIDiterator.fromIterable`](#CarCIDiterator__fromIterable).

An iteration can only be performce _once_ per instantiation.

`CarCIDIterator` also implements the `RootsReader` interface and provides
the [`getRoots()`](#CarCIDiterator__getRoots) method.

Load this class with either
`import { CarCIDIterator } from '@ipld/car/iterator'`
(`const { CarCIDIterator } = require('@ipld/car/iterator')`). Or
`import { CarCIDIterator } from '@ipld/car'`
(`const { CarCIDIterator } = require('@ipld/car')`).

<a name="CarCIDIterator_getRoots"></a>
### `async CarCIDIterator#getRoots()`

* Returns:  `Promise<CID[]>`

Get the list of roots defined by the CAR referenced by this iterator. May be
zero or more `CID`s.

<a name="CarCIDIterator__fromBytes"></a>
### `async CarCIDIterator.fromBytes(bytes)`

* `bytes` `(Uint8Array)`

* Returns:  `Promise<CarCIDIterator>`

Instantiate a [`CarCIDIterator`](#CarCIDIterator) from a `Uint8Array` blob. Rather
than decoding the entire byte array prior to returning the iterator, as in
[`CarReader.fromBytes`](#CarReader__fromBytes), only the header is decoded and the remainder
of the CAR is parsed as the `CID`s as yielded.

<a name="CarCIDIterator__fromIterable"></a>
### `async CarCIDIterator.fromIterable(asyncIterable)`

* `asyncIterable` `(AsyncIterable<Uint8Array>)`

* Returns:  `Promise<CarCIDIterator>`

Instantiate a [`CarCIDIterator`](#CarCIDIterator) from a `AsyncIterable<Uint8Array>`,
such as a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
Rather than decoding the entire byte array prior to returning the iterator,
as in [`CarReader.fromIterable`](#CarReader__fromIterable), only the header is decoded and the
remainder of the CAR is parsed as the `CID`s as yielded.

<a name="CarIndexer"></a>
### `class CarIndexer`

Properties:

* `version` `(number)`: The version number of the CAR referenced by this
  reader (should be `1`).

Provides an iterator over all of the `Block`s in a CAR, returning their CIDs
and byte-location information. Implements an `AsyncIterable<BlockIndex>`.
Where a `BlockIndex` is a
`{ cid:CID, length:number, offset:number, blockLength:number, blockOffset:number }`.

As an implementer of `AsyncIterable`, this class can be used directly in a
`for await (const blockIndex of iterator) {}` loop. Where the `iterator` is
constructed using [`CarIndexer.fromBytes`](#CarIndexer__fromBytes) or
[`CarIndexer.fromIterable`](#CarIndexer__fromIterable).

An iteration can only be performce _once_ per instantiation.

`CarIndexer` also implements the `RootsReader` interface and provides
the [`getRoots()`](#CarIndexer__getRoots) method.

Load this class with either
`import { CarIndexer } from '@ipld/car/indexer'`
(`const { CarIndexer } = require('@ipld/car/indexer')`). Or
`import { CarIndexer } from '@ipld/car'`
(`const { CarIndexer } = require('@ipld/car')`). The former will likely
result in smaller bundle sizes where this is important.

<a name="CarIndexer_getRoots"></a>
### `async CarIndexer#getRoots()`

* Returns:  `Promise<CID[]>`

Get the list of roots defined by the CAR referenced by this indexer. May be
zero or more `CID`s.

<a name="CarIndexer__fromBytes"></a>
### `async CarIndexer.fromBytes(bytes)`

* `bytes` `(Uint8Array)`

* Returns:  `Promise<CarIndexer>`

Instantiate a [`CarIndexer`](#CarIndexer) from a `Uint8Array` blob. Only the header
is decoded initially, the remainder is processed and emitted via the
iterator as it is consumed.

<a name="CarIndexer__fromIterable"></a>
### `async CarIndexer.fromIterable(asyncIterable)`

* `asyncIterable` `(AsyncIterable<Uint8Array>)`

* Returns:  `Promise<CarIndexer>`

Instantiate a [`CarIndexer`](#CarIndexer) from a `AsyncIterable<Uint8Array>`,
such as a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
is decoded initially, the remainder is processed and emitted via the
iterator as it is consumed.

<a name="CarWriter"></a>
### `class CarWriter`

Provides a writer interface for the creation of CAR files.

Creation of a `CarWriter` involves the instatiation of an input / output pair
in the form of a `WriterChannel`, which is a
`{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair. These two
components form what can be thought of as a stream-like interface. The
`writer` component (an instantiated `CarWriter`), has methods to
[`put()`](#CarWriter__put) new blocks and [`close()`](#CarWriter__put)
the writing operation (finalising the CAR archive). The `out` component is
an `AsyncIterable` that yields the bytes of the archive. This can be
redirected to a file or other sink. In Node.js, you can use the
[`Readable.from()`](https://nodejs.org/api/stream.html#stream_stream_readable_from_iterable_options)
API to convert this to a standard Node.js stream, or it can be directly fed
to a
[`stream.pipeline()`](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback).

The channel will provide a form of backpressure. The `Promise` from a
`write()` won't resolve until the resulting data is drained from the `out`
iterable.

It is also possible to ignore the `Promise` from `write()` calls and allow
the generated data to queue in memory. This should be avoided for large CAR
archives of course due to the memory costs and potential for memory overflow.

Load this class with either
`import { CarWriter } from '@ipld/car/writer'`
(`const { CarWriter } = require('@ipld/car/writer')`). Or
`import { CarWriter } from '@ipld/car'`
(`const { CarWriter } = require('@ipld/car')`). The former will likely
result in smaller bundle sizes where this is important.

<a name="CarWriter_put"></a>
### `async CarWriter#put(block)`

* `block` `(Block)`: A `{ cid:CID, bytes:Uint8Array }` pair.

* Returns:  `Promise<void>`: The returned promise will only resolve once the
  bytes this block generates are written to the `out` iterable.

Write a `Block` (a `{ cid:CID, bytes:Uint8Array }` pair) to the archive.

<a name="CarWriter_close"></a>
### `async CarWriter#close()`

* Returns:  `Promise<void>`

Finalise the CAR archive and signal that the `out` iterable should end once
any remaining bytes are written.

<a name="CarWriter__create"></a>
### `async CarWriter.create(roots)`

* `roots` `(CID[]|CID|void)`

* Returns:  `WriterChannel`: The channel takes the form of
  `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }`.

Create a new CAR writer "channel" which consists of a
`{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair.

<a name="CarWriter__createAppender"></a>
### `async CarWriter.createAppender()`

* Returns:  `WriterChannel`: The channel takes the form of
  `{ writer:CarWriter, out:AsyncIterable<Uint8Array> }`.

Create a new CAR appender "channel" which consists of a
`{ writer:CarWriter, out:AsyncIterable<Uint8Array> }` pair.
This appender does not consider roots and does not produce a CAR header.
It is designed to append blocks to an _existing_ CAR archive. It is
expected that `out` will be concatenated onto the end of an existing
archive that already has a properly formatted header.

<a name="CarWriter__updateRootsInBytes"></a>
### `async CarWriter.updateRootsInBytes(bytes, roots)`

* `bytes` `(Uint8Array)`
* `roots` `(CID[])`: A new list of roots to replace the existing list in
  the CAR header. The new header must take up the same number of bytes as the
  existing header, so the roots should collectively be the same byte length
  as the existing roots.

* Returns:  `Promise<Uint8Array>`

Update the list of roots in the header of an existing CAR as represented
in a Uint8Array.

This operation is an _overwrite_, the total length of the CAR will not be
modified. A rejection will occur if the new header will not be the same
length as the existing header, in which case the CAR will not be modified.
It is the responsibility of the user to ensure that the roots being
replaced encode as the same length as the new roots.

The byte array passed in an argument will be modified and also returned
upon successful modification.

<a name="CarWriter__updateRootsInFile"></a>
### `async CarWriter.updateRootsInFile(fd, roots)`

* `fd` `(fs.promises.FileHandle|number)`: A file descriptor from the
  Node.js `fs` module. Either an integer, from `fs.open()` or a `FileHandle`
  from `fs.promises.open()`.
* `roots` `(CID[])`: A new list of roots to replace the existing list in
  the CAR header. The new header must take up the same number of bytes as the
  existing header, so the roots should collectively be the same byte length
  as the existing roots.

* Returns:  `Promise<void>`

Update the list of roots in the header of an existing CAR file. The first
argument must be a file descriptor for CAR file that is open in read and
write mode (not append).

This operation is an _overwrite_, the total length of the CAR will not be
modified. A rejection will occur if the new header will not be the same
length as the existing header, in which case the CAR will not be modified.
It is the responsibility of the user to ensure that the roots being
replaced encode as the same length as the new roots.

This function is **only available in Node.js** and not a browser
environment.

## License

Licensed under either of

 * Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / http://www.apache.org/licenses/LICENSE-2.0)
 * MIT ([LICENSE-MIT](LICENSE-MIT) / http://opensource.org/licenses/MIT)

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
