# cborg - fast CBOR with a focus on strictness

[CBOR](https://cbor.io/) is "Concise Binary Object Representation", defined by [RFC 8949](https://tools.ietf.org/html/rfc8949). Like JSON, but binary, more compact, and supporting a much broader range of data types.

**cborg** focuses on strictness and deterministic data representations. CBORs flexibility leads to problems where determinism matters, such as in content-addressed data where your data encoding should converge on same-bytes for same-data. **cborg** helps aleviate these challenges.

**cborg** is also fast, and is suitable for the browser (is `Uint8Array` native) and Node.js.

**cborg** supports CBOR tags, but does not ship with them enabled by default. If you want tags, you need to plug them in to the encoder and decoder.

* [Example](#example)
* [CLI](#cli)
  * [`cborg bin2diag [binary input]`](#cborg-bin2diag-binary-input)
  * [`cborg bin2hex [binary string]`](#cborg-bin2hex-binary-string)
  * [`cborg bin2json [--pretty] [binary input]`](#cborg-bin2json---pretty-binary-input)
  * [`cborg diag2bin [diagnostic string]`](#cborg-diag2bin-diagnostic-string)
  * [`cborg diag2hex [diagnostic string]`](#cborg-diag2hex-diagnostic-string)
  * [`cborg diag2json [--pretty] [diagnostic string]`](#cborg-diag2json---pretty-diagnostic-string)
  * [`cborg hex2bin [hex string]`](#cborg-hex2bin-hex-string)
  * [`cborg hex2diag [hex string]`](#cborg-hex2diag-hex-string)
  * [`cborg hex2json [--pretty] [hex string]`](#cborg-hex2json---pretty-hex-string)
  * [`cborg json2bin [json string]`](#cborg-json2bin-json-string)
  * [`cborg json2diag [json string]`](#cborg-json2diag-json-string)
  * [`cborg json2hex '[json string]'`](#cborg-json2hex-json-string)
* [API](#api)
  * [`encode(object[, options])`](#encodeobject-options)
    * [Options](#options)
  * [`decode(data[, options])`](#decodedata-options)
    * [Options](#options-1)
  * [`encodedLength(data[, options])`](#encodedlengthdata-options)
  * [Type encoders](#type-encoders)
  * [Tag decoders](#tag-decoders)
* [Deterministic encoding recommendations](#deterministic-encoding-recommendations)
  * [Round-trip consistency](#round-trip-consistency)
* [JSON mode](#json-mode)
  * [Example](#example-1)
* [License and Copyright](#license-and-copyright)

## Example

```js
import { encode, decode } from 'cborg'

const decoded = decode(Buffer.from('a16474686973a26269736543424f522163796179f5', 'hex'))
console.log('decoded:', decoded)
console.log('encoded:', encode(decoded))
```

```
decoded: { this: { is: 'CBOR!', yay: true } }
encoded: Uint8Array(21) [
  161, 100, 116, 104, 105, 115,
  162,  98, 105, 115, 101,  67,
   66,  79,  82,  33,  99, 121,
   97, 121, 245
]
```

## CLI

When installed globally via `npm` (with `npm install cborg --global`), the `cborg` command will be available that provides some handy CBOR CLI utilities. Run with `cborg help` for additional details.

The following commands take either input from the command line, or if no input is supplied will read from stdin. Output is printed to stdout. So you can `cat foo | cborg <command>`.

### `cborg bin2diag [binary input]`

Convert CBOR from binary input to a CBOR diagnostic output format which explains the byte contents.

```
$ cborg hex2bin 84616161620164f09f9880 | cborg bin2diag
84                                                # array(4)
  61                                              #   string(1)
    61                                            #     "a"
  61                                              #   string(1)
    62                                            #     "b"
  01                                              #   uint(1)
  64 f09f                                         #   string(2)
    f09f9880                                      #     "😀"
```

### `cborg bin2hex [binary string]`

A utility method to convert a binary input (stdin only) to hexadecimal output (does not involve CBOR).

### `cborg bin2json [--pretty] [binary input]`

Convert CBOR from binary input to JSON format.

```
$ cborg hex2bin 84616161620164f09f9880 | cborg bin2json
["a","b",1,"😀"]
```

### `cborg diag2bin [diagnostic string]`

Convert a CBOR diagnostic string to a binary data form of the CBOR.

```
$ cborg json2diag '["a","b",1,"😀"]' | cborg diag2bin | cborg bin2hex
84616161620164f09f9880
```

### `cborg diag2hex [diagnostic string]`

Convert a CBOR diagnostic string to the CBOR bytes in hexadecimal format.

```
$ cborg json2diag '["a","b",1,"😀"]' | cborg diag2hex
84616161620164f09f9880
```

### `cborg diag2json [--pretty] [diagnostic string]`

Convert a CBOR diagnostic string to JSON format.

```
$ cborg json2diag '["a","b",1,"😀"]' | cborg diag2json
["a","b",1,"😀"]
```

### `cborg hex2bin [hex string]`

A utility method to convert a hex string to binary output (does not involve CBOR).

### `cborg hex2diag [hex string]`

Convert CBOR from a hexadecimal string to a CBOR diagnostic output format which explains the byte contents.

```
$ cborg hex2diag 84616161620164f09f9880
84                                                # array(4)
  61                                              #   string(1)
    61                                            #     "a"
  61                                              #   string(1)
    62                                            #     "b"
  01                                              #   uint(1)
  64 f09f                                         #   string(2)
    f09f9880                                      #     "😀"
```

### `cborg hex2json [--pretty] [hex string]`

Convert CBOR from a hexadecimal string to JSON format.

```
$ cborg hex2json 84616161620164f09f9880
["a","b",1,"😀"]
$ cborg hex2json --pretty 84616161620164f09f9880
[
  "a",
  "b",
  1,
  "😀"
]
```

### `cborg json2bin [json string]`

Convert a JSON object into a binary data form of the CBOR.

```
$ cborg json2bin '["a","b",1,"😀"]' | cborg bin2hex
84616161620164f09f9880
```

### `cborg json2diag [json string]`

Convert a JSON object into a CBOR diagnostic output format which explains the contents of the CBOR form of the input object.

```
$ cborg json2diag '["a", "b", 1, "😀"]'
84                                                # array(4)
  61                                              #   string(1)
    61                                            #     "a"
  61                                              #   string(1)
    62                                            #     "b"
  01                                              #   uint(1)
  64 f09f                                         #   string(2)
    f09f9880                                      #     "😀"
```

### `cborg json2hex '[json string]'`

Convert a JSON object into CBOR bytes in hexadecimal format.

```
$ cborg json2hex '["a", "b", 1, "😀"]'
84616161620164f09f9880
```

## API

### `encode(object[, options])`

```js
import { encode } from 'cborg'
```

```js
const { encode } = require('cborg')
```

Encode a JavaScript object and return a `Uint8Array` with the CBOR byte representation.

* Objects containing circular references will be rejected.
* JavaScript objects that don't have standard CBOR type representations (without tags) may be rejected or encoded in surprising ways. If you need to encode a `Date` or a `RegExp` or another exotic type, you should either form them into intermediate forms before encoding or enable a tag encoder (see [Type encoders](#type-encoders)).
  * Natively supported types are: `null`, `undefined`, `number`, `bigint`, `string`, `boolean`, `Array`, `Object`, `Map`, `Buffer`, `ArrayBuffer`, `DataView`, `Uint8Array` and all other `TypedArray`s (the underlying byte array of TypedArrays is encoded, so they will all round-trip as a `Uint8Array` since the type information is lost).
* `Number`s will be encoded as integers if they don't have a fractional part (`1` and `1.0` are both considered integers, they are identical in JavaScript). Otherwise they will be encoded as floats.
* Integers will be encoded to their smallest possible representations: compacted (into the type byte), 8-bit, 16-bit, 32-bit or 64-bit.
* Integers larger than `Number.MAX_SAFE_INTEGER` or less than `Number.MIN_SAFE_INTEGER` will be encoded as floats. There is no way to safely determine whether a number has a fractional part outside of this range.
* `BigInt`s are supported by default within the 64-bit unsigned range but will be also be encoded to their smallest possible representation (so will not round-trip as a `BigInt` if they are smaller than `Number.MAX_SAFE_INTEGER`). Larger `BigInt`s require a tag (officially tags 2 and 3).
* Floats will be encoded in their smallest possible representations: 16-bit, 32-bit or 64-bit. Unless the `float64` option is supplied.
* Object properties are sorted according to the original [RFC 7049](https://tools.ietf.org/html/rfc7049) canonical representation recommended method: length-first and then bytewise. Note that this recommendation has changed in [RFC 8949](https://tools.ietf.org/html/rfc8949) to be plain bytewise (this is not currently supported but pull requests are welcome to add it as an option).
* The only CBOR major 7 "simple values" supported are `true`, `false`, `undefined` and `null`. "Simple values" outside of this range are intentionally not supported (pull requests welcome to enable them with an option).
* Objects, arrays, strings and bytes are encoded as fixed-length, encoding as indefinite length is intentionally not supported.

#### Options

* `float64` (boolean, default `false`): do not attempt to store floats as their smallest possible form, store all floats as 64-bit
* `typeEncoders` (object): a mapping of type name to function that can encode that type into cborg tokens. This may also be used to reject or transform types as objects are dissected for encoding. See the [Type encoders](#type-encoders) section below for more information.
* `mapSorter` (function): a function taking two arguments, where each argument is a `Token`, or an array of `Token`s representing the keys of a map being encoded. Similar to other JavaScript compare functions, a `-1`, `1` or `0` (which shouldn't be possible) should be returned depending on the sorting order of the keys. See the source code for the default sorting order which uses the length-first rule recommendation from [RFC 7049](https://tools.ietf.org/html/rfc7049).

### `decode(data[, options])`

```js
import { decode } from 'cborg'
```

```js
const { decode } = require('cborg')
```

Decode valid CBOR bytes from a `Uint8Array` (or `Buffer`) and return a JavaScript object.

* Integers (major 0 and 1) that are outside of the safe integer range will be converted to a `BigInt`.
* The only CBOR major 7 "simple values" supported are `true`, `false`, `undefined` and `null`. "Simple values" outside of this range are intentionally not supported (pull requests welcome to enable them with an option).
* Indefinite length strings and byte arrays are intentionally not supported (pull requests welcome to enable them with an option). Although indefinite length arrays and maps are supported by default.

#### Options

* `allowIndefinite` (boolean, default `true`): when the indefinite length additional information (`31`) is encountered for any type (arrays, maps, strings, bytes) _or_ a "break" is encountered, an error will be thrown.
* `allowUndefined` (boolean, default `true`): when major 7, minor 23 (`undefined`) is encountered, an error will be thrown. To disallow `undefined` on encode, a custom [type encoder](#type-encoders) for `'undefined'` will need to be supplied.
* `coerceUndefinedToNull` (boolean, default `false`): when both `allowUndefined` and `coerceUndefinedToNull` are set to `true`, all `undefined` tokens (major `7` minor `23`: `0xf7`) will be coerced to `null` tokens, such that `undefined` is an allowed token but will not appear in decoded values.
* `allowInfinity` (boolean, default `true`): when an IEEE 754 `Infinity` or `-Infinity` value is encountered when decoding a major 7, an error will be thrown. To disallow `Infinity` and `-Infinity` on encode, a custom [type encoder](#type-encoders) for `'number'` will need to be supplied.
* `allowNaN` (boolean, default `true`): when an IEEE 754 `NaN` value is encountered when decoding a major 7, an error will be thrown. To disallow `NaN` on encode, a custom [type encoder](#type-encoders) for `'number'` will need to be supplied.
* `allowBigInt` (boolean, default `true`): when an integer outside of the safe integer range is encountered, an error will be thrown. To disallow `BigInt`s on encode, a custom [type encoder](#type-encoders) for `'bigint'` will need to be supplied.
* `strict` (boolean, default `false`): when decoding integers, including for lengths (arrays, maps, strings, bytes), values will be checked to see whether they were encoded in their smallest possible form. If not, an error will be thrown.
  * Currently, this form of deterministic strictness cannot be enforced for float representations, or map key ordering (pull requests _very_ welcome).
* `useMaps` (boolean, default `false`): when decoding major 5 (map) entries, use a `Map` rather than a plain `Object`. This will nest for any encountered map. During encode, a `Map` will be interpreted as an `Object` and will round-trip as such unless `useMaps` is supplied, in which case, all `Map`s and `Object`s will round-trip as `Map`s. There is no way to retain the distinction during round-trip without using a custom tag.
* `rejectDuplicateMapKeys` (boolean, default `false`): when the decoder encounters duplicate keys for the same map, an error will be thrown when this option is set. This is an additional _strictness_ option, disallowing data-hiding and reducing the number of same-data different-bytes possibilities where it matters.
* `retainStringBytes` (boolean, default `false`): when decoding strings, retain the original bytes on the `Token` object as `byteValue`. Since it is possible to encode non-UTF-8 characters in strings in CBOR, and JavaScript doesn't properly handle non-UTF-8 in its conversion from bytes (`TextEncoder` or `Buffer`), this can result in a loss of data (and an inability to round-trip). Where this is important, a token stream should be consumed instead of a plain `decode()` and the `byteValue` property on string tokens can be inspected (see [lib/diagnostic.js](lib/diagnostic.js) for an example of its use.)
* `tags` (array): a mapping of tag number to tag decoder function. By default no tags are supported. See [Tag decoders](#tag-decoders).
* `tokenizer` (object): an object with two methods, `next()` which returns a `Token` and `done()` which returns a `boolean`. Can be used to implement custom input decoding. See the source code for examples.

### `encodedLength(data[, options])`

```js
import { encodedLength } from 'cborg/length'
```

```js
const { encodedLength } = require('cborg/length')
```

Calculate the byte length of the given data when encoded as CBOR with the options provided. The options are the same as for an `encode()` call. This calculation will be accurate if the same options are used as when performing a normal `encode()`. Some encode options can change the encoding output length.

A `tokensToLength()` function is available which deals directly with a tokenized form of the object, but this only recommended for advanced users.

### Type encoders

The `typeEncoders` property to the `options` argument to `encode()` allows you to add additional functionality to cborg, or override existing functionality.

When converting JavaScript objects, types are differentiated using the method and naming used by [@sindresorhus/is](https://github.com/sindresorhus/is) _(a custom implementation is used internally for performance reasons)_ and an internal set of type encoders are used to convert objects to their appropriate CBOR form. Supported types are: `null`, `undefined`, `number`, `bigint`, `string`, `boolean`, `Array`, `Object`, `Map`, `Buffer`, `ArrayBuffer`, `DataView`, `Uint8Array` and all other `TypedArray`s (their underlying byte array is encoded, so they will all round-trip as a `Uint8Array` since the type information is lost). Any object that doesn't match a type in this list will cause an error to be thrown during decode. e.g. `encode(new Date())` will throw an error because there is no internal `Date` type encoder.

The `typeEncoders` option is an object whose property names match to @sindresorhus/is type names. When this option is provided and a property exists for any given object's type, the function provided as the value to that property is called with the object as an argument.

If a type encoder function returns `null`, the default encoder, if any, is used instead.

If a type encoder function returns an array, cborg will expect it to contain zero or more `Token` objects that will be encoded to binary form.

`Token`s map directly to CBOR entities. Each one has a `Type` and a `value`. A type encoder is responsible for turning a JavaScript object into a set of tags.

This example is available from the cborg taglib as `bigIntEncoder` (`import { bigIntEncoder } as taglib from 'cborg/taglib'`) and implements CBOR tags 2 and 3 (bigint and negative bigint). This function would be registered using an options parameter `{ typeEncoders: { bigint: bigIntEncoder } }`. All objects that have a type `bigint` will pass through this function.

```js
import { Token, Type } from './cborg.js'

function bigIntEncoder (obj) {
  // check whether this BigInt could fit within a standard CBOR 64-bit int or less
  if (obj >= -1n * (2n ** 64n) && obj <= (2n ** 64n) - 1n) {
    return null // handle this as a standard int or negint
  }
  // it's larger than a 64-bit int, encode as tag 2 (positive) or 3 (negative)
  return [
    new Token(Type.tag, obj >= 0n ? 2 : 3),
    new Token(Type.bytes, fromBigInt(obj >= 0n ? obj : obj * -1n - 1n))
  ]
}

function fromBigInt (i) { /* returns a Uint8Array, omitted from example */ }
```

This example encoder demonstrates the ability to pass-through to the default encoder, or convert to a series of custom tags. In this case we can put any arbitrarily large `BigInt` into a byte array using the standard CBOR tag 2 and 3 types.

Valid `Token` types for the second argument to `Token()` are:

```js
Type.uint
Type.negint
Type.bytes
Type.string
Type.array
Type.map
Type.tag
Type.float
Type.false
Type.true
Type.null
Type.undefined
Type.break
```

Using type encoders we can:
 * Override the default encoder entirely (always return an array of `Token`s)
 * Override the default encoder for a subset of values (use `null` as a pass-through)
 * Omit an object type entirely from the encode (return an empty array)
 * Convert an object to something else entirely (such as a tag, or make all `number`s into floats)
 * Throw if something should that is supported should be unsupported (e.g. `undefined`)

### Tag decoders

By default cborg does not support decoding of any tags. Where a tag is encountered during decode, an error will be thrown. If tag support is needed, they will need to be supplied as options to the `decode()` function. The `tags` property should contain an array where the indexes correspond to the tag numbers that are encountered during decode, and the values are functions that are able to turn the following token(s) into a JavaScript object. Each tag token in CBOR is followed by a data item, often a byte array of arbitrary length, but can be a more complex series of tokens that form a nested data item. This token is supplied to the tag decoder function.

This example is available from the cborg taglib as `bigIntDecoder` and `bigNegIntDecoder` (`import { bigIntDecoder, bigNegIntDecoder } as taglib from 'cborg/taglib'`) and implements CBOR tags 2 and 3 (bigint and negative bigint). This function would be registered using an options parameter:

```js
const tags = []
tags[2] = bigIntDecoder
tags[3] = bigNegIntDecoder

decode(bytes, { tags })
```

Implementation:

```js
function bigIntDecoder (bytes) {
  let bi = 0n
  for (let ii = 0; ii < bytes.length; ii++) {
    bi = (bi << 8n) + BigInt(bytes[ii])
  }
  return bi
}

function bigNegIntDecoder (bytes) {
  return -1n - bigIntDecoder(bytes)
}
```

## Deterministic encoding recommendations

cborg is designed with deterministic encoding forms as a primary feature. It is suitable for use with content addressed systems or other systems where convergence of binary forms is important. The ideal is to have strictly _one way_ of mapping a set of data into a binary form. Unfortunately CBOR has many opportunities for flexibility, including:

* Varying number sizes and no strict requirement for their encoding - e.g. a `1` may be encoded as `0x01`, `0x1801`, `0x190001`, `1a00000001` or `1b0000000000000001`.
* Varying int sizes used as lengths for lengthed objects (maps, arrays, strings, bytes) - e.g. a single entry array could specify its length using any of the above forms for `1`. Tags can also vary in size and still represent the same number.
* IEEE 754 allows for `NaN`, `Infinity` and `-Infinity` to be represented in many different ways, meaning it is possible to represent the same data using many different byte forms.
* Indefinite length items where the length is omitted from the additional item of the entity token and a "break" is inserted to indicate the end of of the object. This provides two ways to encode the same object.
* Tags that can allow alternative representations of objects - e.g. using the bigint or negative bigint tags to represent standard size integers.
* Map ordering is flexible by default, so a single map can be represented in many different forms by shuffling the keys.
* Many CBOR decoders ignore trailing bytes that are not part of an initial object. This can be helpful to support streaming-CBOR, but opens avenues for byte padding.

By default, cborg will always **encode** objects to the same bytes by applying some strictness rules:

* Using smallest-possible representations for ints, negative ints, floats and lengthed object lengths.
* Always sorting maps using the _original_ recommended [RFC 7049](https://tools.ietf.org/html/rfc7049) map key ordering rules.
* Omitting support for tags (therefore omitting support for exotic object types).
* Applying deterministic rules to `number` differentiation - if a fractional part is missing and it's within the safe integer boundary, it's encoded as an integer, otherwise it's encoded as a float.

By default, cborg allows for some flexibility on **decode** of objects, which will present some challenges if users wish to impose strictness requirements at both serialization _and_ deserialization. Options that can be provided to `decode()` to impose some strictness requirements are:

* `strict: true` to impose strict sizing rules for int, negative ints and lengths of lengthed objects
* `allowNaN: false` and `allowInfinity` to prevent decoding of any value that would resolve to `NaN`, `Infinity` or `-Infinity`, using CBOR tokens or IEEE 754 representation—as long as your application can do without these symbols.
* `allowIndefinite: false` to disallow indefinite lengthed objects and the "break" tag
* Not providing any tag decoders, or ensuring that tag decoders are strict about their forms (e.g. a bigint decoder could reject bigints that could have fit into a standard major 0 64-bit integer).
* Overriding type decoders where they may introduce undesired flexibility.

Currently, there are two areas that cborg cannot impose strictness requirements (pull requests welcome!):

* Smallest-possible floats, or always-float64 cannot be enforced on decode.
* Map ordering cannot be enforced on decode.

### Round-trip consistency

There are a number of forms where an object will not round-trip precisely, if this matters for an application, care should be taken, or certain types should be disallowed entirely during encode.

* All `TypedArray`s will decode as `Uint8Array`s, unless a custom tag is used.
* Both `Map` and `Object` will be encoded as a CBOR `map`, as will any other object that inherits from `Object` that can't be differentiated by the [@sindresorhus/is](https://github.com/sindresorhus/is) algorithm. They will all decode as `Object` by default, or `Map` if `useMaps` is set to `true`. e.g. `{ foo: new Map() }` will round-trip to `{ foo: {} }` by default.

## JSON mode

**cborg** can also encode and decode JSON using the same pipeline and many of the same settings. For most (but not all) cases it will be faster to use `JSON.parse()` and `JSON.stringify()`, however **cborg** provides much more control over the process to handle determinism and be more restrictive in allowable forms. It also operates natively with Uint8Arrays rather than strings which may also offer some minor efficiency or usability gains in some circumstances.

Use `import { encode, decode } from 'cborg/json'` or `const { encode, decode } = require('cborg/json')` to access the JSON handling encoder and decoder.

Many of the same encode and decode options available for CBOR can be used to manage JSON handling. These include strictness requirements for decode and custom tag encoders for encode. Tag encoders can't create new tags as there are no tags in JSON, but they can replace JavaScript object forms with custom JSON forms (e.g. convert a `Uint8Array` to a valid JSON form rather than having the encoder throw an error). The inverse is also possible, turning specific JSON forms into JavaScript forms, by using a custom tokenizer on decode.

Special notes on options specific to the JSON:

* Decoder `allowBigInt` option: is repurposed for the JSON decoder and defaults to `false`. When `false`, all numbers are decoded as `Number`, possibly losing precision when encountering numbers outside of the JavaScript safe integer range. When `true` numbers that have a decimal point (`.`, even if just `.0`) are returned as a `Number`, but for numbers without a decimal point _and_ that are outside of the JavaScript safe integer range, they are returned as `BigInt`s. This behaviour differs from CBOR decoding which will error when decoding integer and negative integer tokens that are outside of the JavaScript safe integer range if `allowBigInt` is `false`.

See **[@ipld/dag-json](https://github.com/ipld/js-dag-json)** for an advanced use of the **cborg** JSON encoder and decoder including round-tripping of `Uint8Array`s and custom JavaScript classes (IPLD `CID` objects in this case).

### Example

Similar to the [CBOR example above](#example), using JSON:

```js
import { encode, decode } from 'cborg/json'

const decoded = decode(Buffer.from('7b2274686973223a7b226973223a224a534f4e21222c22796179223a747275657d7d', 'hex'))
console.log('decoded:', decoded)
console.log('encoded:', encode(decoded))
console.log('encoded (string):', Buffer.from(encode(decoded)).toString())
```

```
decoded: { this: { is: 'JSON!', yay: true } }
encoded: Uint8Array(34) [
  123,  34, 116, 104, 105, 115,  34,  58,
  123,  34, 105, 115,  34,  58,  34,  74,
   83,  79,  78,  33,  34,  44,  34, 121,
   97, 121,  34,  58, 116, 114, 117, 101,
  125, 125
]
encoded (string): {"this":{"is":"JSON!","yay":true}}
```

## License and Copyright

Copyright 2020 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
