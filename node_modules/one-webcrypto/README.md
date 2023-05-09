# one-webcrypto

The [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is available in [most browsers](https://caniuse.com/cryptography), under a global variable:

```js
// in web pages
const webcrypto = window.crypto
// in web workers, etc.
const webcrypto = self.crypto
// or generally under
const webcrypto = globalThis.crypto
```

It is also [available in NodeJS](https://nodejs.org/api/webcrypto.html#webcrypto_web_crypto_api) since version 15.

However, it is accessed differently:

```js
// in node with commonjs
const webcrypto = require("crypto").webcrypto
// in node with ES Modules
import crypto from "crypto"
const webcrypto = crypto.webcrypto
```

These different ways of getting access to valuable cryptographic primitives (see `webcrypto.subtle`) accross platforms (node & browsers) are hard to get right.


## Usage

With this package, you can just import the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) like so:

```js
import { webcrypto } from "one-webcrypto"

webcrypto.getRandomValues( //...
await webcrypto.subtle.generateKey( //...
```

Or with CommonJS:

```js
const { webcrypto } = require("one-webcrypto")
```


## Compatibility Issues

This package uses a fairly new package.json standard field, the `exports` field.

Read more about it:
* ["export maps" in nodejs documentation](https://nodejs.org/api/packages.html#packages_package_entry_points). 
* ["package exports" in webpack documentation](https://webpack.js.org/guides/package-exports/)
* [original "pkg exports" proposal](https://github.com/jkrems/proposal-pkg-exports/)

We're also making use of webpack's pseudo-standard of the ["browser" flag](https://webpack.js.org/guides/package-exports/#target-environment) for imports.

So if your environment doesn't support that, it _may_ or _may not_ work.

We know that this setup works (*should work*) with
* NodeJS 15+ (thus also e.g. mocha)
* ESBuild
* Webpack 5
* Vite
* SvelteKit
* Snowpack
* Parcel 2

We know that this setup can have issues with
* Create React App

If you have **any experience** (whether it supports the claims above or not), **please create an issue**.
The idea is to help each other out in these crazy bundler times and document what works and what doesn't. :)
