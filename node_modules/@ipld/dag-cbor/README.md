# @ipld/dag-cbor

JS implementation of `dag-cbor`.

This is the *new* interface meant for use by itself or with `multiformats` and
`@ipld/block`. It is not used by `js-ipld-format` which is currently
used in IPFS. That library is [here](https://github.com/ipld/js-ipld-dag-cbor).

Usage:

```javascript
import { encode, decode } from '@ipld/dag-cbor'
import { CID } from 'multiformats'

const obj = {
  x: 1,
  /* CID instances are encoded as links */
  y: [2, 3, CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
  z: {
    a: CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
    b: null,
    c: 'string'
  }
}

let data = encode(obj)
let decoded = decode(data)
decoded.y[0] // 2
CID.asCID(decoded.z.a) // cid instance
```

# Spec

The [`dag-cbor` specification is in the IPLD specs repo](https://github.com/ipld/specs/blob/master/block-layer/codecs/dag-cbor.md).
