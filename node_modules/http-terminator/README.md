<a name="http-terminator"></a>
# http-terminator 🦾

[![Travis build status](http://img.shields.io/travis/gajus/http-terminator/master.svg?style=flat-square)](https://travis-ci.com/gajus/http-terminator)
[![Coveralls](https://img.shields.io/coveralls/gajus/http-terminator.svg?style=flat-square)](https://coveralls.io/github/gajus/http-terminator)
[![NPM version](http://img.shields.io/npm/v/http-terminator.svg?style=flat-square)](https://www.npmjs.org/package/http-terminator)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Gracefully terminates HTTP(S) server.

* [http-terminator 🦾](#http-terminator)
    * [Behaviour](#http-terminator-behaviour)
    * [API](#http-terminator-api)
    * [Usage](#http-terminator-usage)
        * [Usage with Express](#http-terminator-usage-usage-with-express)
        * [Usage with Fastify](#http-terminator-usage-usage-with-fastify)
        * [Usage with Koa](#http-terminator-usage-usage-with-koa)
        * [Usage with other HTTP frameworks](#http-terminator-usage-usage-with-other-http-frameworks)
    * [Alternative libraries](#http-terminator-alternative-libraries)
    * [FAQ](#http-terminator-faq)
        * [What is the use case for http-terminator?](#http-terminator-faq-what-is-the-use-case-for-http-terminator)


<a name="http-terminator-behaviour"></a>
## Behaviour

When you call [`server.close()`](https://nodejs.org/api/http.html#http_server_close_callback), it stops the server from accepting new connections, but it keeps the existing connections open indefinitely. This can result in your server hanging indefinitely due to keep-alive connections or because of the ongoing requests that do not produce a response. Therefore, in order to close the server, you must track creation of all connections and terminate them yourself.

http-terminator implements the logic for tracking all connections and their termination upon a timeout. http-terminator also ensures graceful communication of the server intention to shutdown to any clients that are currently receiving response from this server.

<a name="http-terminator-api"></a>
## API

```js
import {
  createHttpTerminator,
} from 'http-terminator';

/**
 * @property gracefulTerminationTimeout Number of milliseconds to allow for the active sockets to complete serving the response (default: 5000).
 * @property server Instance of http.Server.
 */
type HttpTerminatorConfigurationInputType = {|
  +gracefulTerminationTimeout?: number,
  +server: Server,
|};

/**
 * @property terminate Terminates HTTP server.
 */
type HttpTerminatorType = {|
  +terminate: () => Promise<void>,
|};


const httpTerminator: HttpTerminatorType = createHttpTerminator(
  configuration: HttpTerminatorConfigurationInputType
);

```

<a name="http-terminator-usage"></a>
## Usage

Use `createHttpTerminator` to create an instance of http-terminator and instead of using `server.close()`, use `httpTerminator.terminate()`, e.g.

```js
import http from 'http';
import {
  createHttpTerminator,
} from 'http-terminator';

const server = http.createServer();

const httpTerminator = createHttpTerminator({
  server,
});

await httpTerminator.terminate();

```

<a name="http-terminator-usage-usage-with-express"></a>
### Usage with Express

Usage with [Express](https://www.npmjs.com/package/express) example:

```js
import express from 'express';
import {
  createHttpTerminator,
} from 'http-terminator';

const app = express();

const server = app.listen();

const httpTerminator = createHttpTerminator({
  server,
});

await httpTerminator.terminate();

```

<a name="http-terminator-usage-usage-with-fastify"></a>
### Usage with Fastify

Usage with [Fastify](https://www.npmjs.com/package/fastify) example:

```js
import fastify from 'fastify';
import {
  createHttpTerminator,
} from 'http-terminator';

const app = fastify();

void app.listen(0);

const httpTerminator = createHttpTerminator({
  server: app.server,
});

await httpTerminator.terminate();

```

<a name="http-terminator-usage-usage-with-koa"></a>
### Usage with Koa

Usage with [Koa](https://www.npmjs.com/package/koa) example:

```js
import Koa from 'koa';
import {
  createHttpTerminator,
} from 'http-terminator';

const app = new Koa();

const server = app.listen();

const httpTerminator = createHttpTerminator({
  server,
});

await httpTerminator.terminate();

```

<a name="http-terminator-usage-usage-with-other-http-frameworks"></a>
### Usage with other HTTP frameworks

As it should be clear from the usage examples for Node.js HTTP server, Express and Koa, http-terminator works by accessing an instance of a Node.js [`http.Server`](https://nodejs.org/api/http.html#http_class_http_server). To understand how to use http-terminator with your framework, identify how to access an instance of `http.Server` and use it to create a http-terminator instance.

<a name="http-terminator-alternative-libraries"></a>
## Alternative libraries

There are several alternative libraries that implement comparable functionality, e.g.

* https://github.com/hunterloftis/stoppable
* https://github.com/thedillonb/http-shutdown
* https://github.com/tellnes/http-close
* https://github.com/sebhildebrandt/http-graceful-shutdown

The main benefit of http-terminator is that:

* it does not monkey-patch Node.js API
* it immediately destroys all sockets without an attached HTTP request
* it allows graceful timeout to sockets with ongoing HTTP requests
* it properly handles HTTPS connections
* it informs connections using keep-alive that server is shutting down by setting a `connection: close` header
* it does not terminate the Node.js process

<a name="http-terminator-faq"></a>
## FAQ

<a name="http-terminator-faq-what-is-the-use-case-for-http-terminator"></a>
### What is the use case for http-terminator?

To gracefully terminate a HTTP server.

We say that a service is gracefully terminated when service stops accepting new clients, but allows time to complete the existing requests.

There are several reasons to terminate services gracefully:

* Terminating a service gracefully ensures that the client experience is not affected (assuming the service is load-balanced).
* If your application is stateful, then when services are not terminated gracefully, you are risking data corruption.
* Forcing termination of the service with a timeout ensures timely termination of the service (otherwise the service can remain hanging indefinitely).
