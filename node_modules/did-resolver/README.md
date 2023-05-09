[![npm](https://img.shields.io/npm/dt/did-resolver.svg)](https://www.npmjs.com/package/did-resolver)
[![npm](https://img.shields.io/npm/v/did-resolver.svg)](https://www.npmjs.com/package/did-resolver)
[![codecov](https://codecov.io/gh/decentralized-identity/did-resolver/branch/master/graph/badge.svg)](https://codecov.io/gh/decentralized-identity/did-resolver)

# Typescript DID Resolver

This library is intended as a simple common interface for javascript applications to resolve DID documents from
Decentralized Identifiers (DIDs).

This is intended to support the proposed [Decentralized Identifiers](https://w3c.github.io/did-core/#identifier) spec
from the [W3C Credentials Community Group](https://w3c-ccg.github.io).

The library does not implement any specific DID method, but allows DID method implementors to release npm packages that
applications can add.

## Configure `Resolver` object

You are now required to preconfigure a resolver during instantiation. The `Resolver` constructor expects a registry of
methods mapped to a resolver function. For example:

```js
{
  ethr: resolve,
  web: resolve
}
```

Each method resolver should expose a function called `getResolver` which will return an object containing one of these
key/value pairs. Then you can flatten them into one object to pass into the `Resolver` constructor.

```js
import { Resolver } from 'did-resolver'
import ethr from 'ethr-did-resolver'
import web from 'web-did-resolver'
import sov from 'sov-did-resolver'

//returns an object of { methodName: resolveFunction}
ethrResolver = ethr.getResolver()
webResolver = web.getResolver()

//If you are using multiple methods you need to flatten them into one object
const resolver = new Resolver({
  ...ethrResolver,
  ...webResolver,
})

//If you are using one method you can simply pass the result of getResolver( into the constructor
const resolver = new Resolver(ethrResolver)
```

### Using legacy DID Method resolvers

DID Method resolvers created before version `3.0.0` of this library can be used as legacy resolvers.

```js
import { Resolver } from 'did-resolver'
import web from 'web-did-resolver'
import sov from 'sov-did-resolver'

//returns an object of { methodName: resolveFunction}
webResolver = web.getResolver()
sovResolver = sov.getResolver()

//If you are using multiple methods you need to flatten them into one object
const resolver = new Resolver({}, {
  legacyResolvers: {
    ...webResolver,
    ...sovResolver,
  }
})

//If you are using one method you can simply pass the result of getResolver( into the constructor
const resolver = new Resolver(ethrResolver)
```

## Resolving a DID document

The resolver presents a simple `resolve()` function that returns a ES6 Promise returning the DID document.

```js
resolver.resolve('did:ethr:0xF3beAC30C498D9E26865F34fCAa57dBB935b0D74/some/path#fragment=123').then(doc => console.log)

// You can also use ES7 async/await syntax
const doc = await resolver.resolve('did:ethr:0xF3beAC30C498D9E26865F34fCAa57dBB935b0D74/some/path#fragment=123')
```

## Caching

Resolving DID Documents can be expensive. It is in most cases best to cache DID documents. Caching has to be
specifically enabled using the `cache` parameter

The built-in cache uses a Map, but does not have an automatic TTL, so entries don't expire. This is fine in most web,
mobile and serverless contexts. If you run a long-running process you may want to use an existing configurable caching
system.

The built-in Cache can be enabled by passing in a `true` value to the constructor:

```js
const resolver = new DIDResolver({
  ethr,
  web
}, {
  cache: true
})
```

Here is an example using `js-cache` which has not been tested.

```js
var cache = require('js-cache')
const customCache : DIDCache = (parsed, resolve) => {
  // DID spec requires to not cache if no-cache param is set
  if (parsed.params && parsed.params['no-cache'] === 'true') return await resolve()
  const cached = cache.get(parsed.didUrl)
  if (cached !== undefined) return cached
  const doc = await resolve()
  cache.set(parsed, doc, 60000)
  return doc
}

const resolver = new DIDResolver({
  ethr,
  web
}, {
  cache: customCache
})
```

## Implementing a DID method

Each DID method will have its own methods for looking up an identifier on its respective blockchain or other
decentralized storage mechanism.

To avoid misconfiguration, method implementers should export a `getResolver()` function which returns an object mapping
the method name to a `resolve(did: string, parsed: ParsedDID, didResolver: DIDResolver, options: DIDResolutionOptions)`
function. e.g. `{ ethr: resolve }`.

The resolve function should accept a did string, and an object of
type [ParsedDID](https://github.com/decentralized-identity/did-resolver/blob/master/src/resolver.ts#L112)

```js
export function getResolver() {
  async function resolve(
    did: string,
    parsed: ParsedDID,
    didResolver: Resolver,
    options: DIDResolutionOptions
  ): Promise<DIDDocument> {
    console.log(parsed)
    // {method: 'mymethod', id: 'abcdefg', did: 'did:mymethod:abcdefg/some/path#fragment=123', path: '/some/path', fragment: 'fragment=123'}
    const didDoc = ...// lookup doc
    // If you need to lookup another did as part of resolving this did document, the primary DIDResolver object is passed in as well
    const parentDID = await didResolver.resolve(...)
    // Return the DIDResolutionResult object
    return {
      didResolutionMetadata: { contentType: 'application/did+ld+json' },
      didDocument: didDoc
      didDocumentMetadata: { ... }
    }
  }

  return { myMethod: resolve }
}
```

The MyMethod `getResolver()` result could then be passed into the DIDResolver constructor. Note that it should be
flattened if used with other methods as well.

```js
import { DIDResolver } from 'did-resolver'
import MyMethod from 'mymethod-did-resolver'

const myResolver = MyMethod.getResolver()
const resolver = new DIDResolver(myResolver)
```
