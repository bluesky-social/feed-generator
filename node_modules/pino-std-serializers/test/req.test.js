'use strict'

const http = require('http')
const test = require('tap').test
const serializers = require('../lib/req')
const wrapRequestSerializer = require('../').wrapRequestSerializer

test('maps request', function (t) {
  t.plan(2)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    const serialized = serializers.mapHttpRequest(req)
    t.ok(serialized.req)
    t.ok(serialized.req.method)
    t.end()
    res.end()
  }
})

test('does not return excessively long object', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    t.equal(Object.keys(serialized).length, 6)
    res.end()
  }
})

test('req.raw is available', function (t) {
  t.plan(2)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.foo = 'foo'
    const serialized = serializers.reqSerializer(req)
    t.ok(serialized.raw)
    t.equal(serialized.raw.foo, 'foo')
    res.end()
  }
})

test('req.raw will be obtained in from input request raw property if input request raw property is truthy', function (t) {
  t.plan(2)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.raw = { req: { foo: 'foo' }, res: {} }
    const serialized = serializers.reqSerializer(req)
    t.ok(serialized.raw)
    t.equal(serialized.raw.req.foo, 'foo')
    res.end()
  }
})

test('req.id defaults to undefined', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.id, undefined)
    res.end()
  }
})

test('req.id has a non-function value', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    t.equal(typeof serialized.id === 'function', false)
    res.end()
  }
})

test('req.id will be obtained from input request info.id when input request id does not exist', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.info = { id: 'test' }
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.id, 'test')
    res.end()
  }
})

test('req.id has a non-function value with custom id function', function (t) {
  t.plan(2)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.id = function () { return 42 }
    const serialized = serializers.reqSerializer(req)
    t.equal(typeof serialized.id === 'function', false)
    t.equal(serialized.id, 42)
    res.end()
  }
})

test('req.url will be obtained from input request req.path when input request url is an object', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.path = '/test'
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, '/test')
    res.end()
  }
})

test('req.url will be obtained from input request url.path when input request url is an object', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.url = { path: '/test' }
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, '/test')
    res.end()
  }
})

test('req.url will be obtained from input request url when input request url is not an object', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.url = '/test'
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, '/test')
    res.end()
  }
})

test('req.url will be empty when input request path and url are not defined', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, '/')
    res.end()
  }
})

test('req.url will be obtained from input request originalUrl when available', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.originalUrl = '/test'
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, '/test')
    res.end()
  }
})

test('req.url will be obtained from input request url when req path is a function', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.path = function () {
      throw new Error('unexpected invocation')
    }
    req.url = '/test'
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, '/test')
    res.end()
  }
})

test('req.url being undefined does not throw an error', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.url = undefined
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.url, undefined)
    res.end()
  }
})

test('can wrap request serializers', function (t) {
  t.plan(3)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  const serailizer = wrapRequestSerializer(function (req) {
    t.ok(req.method)
    t.equal(req.method, 'GET')
    delete req.method
    return req
  })

  function handler (req, res) {
    const serialized = serailizer(req)
    t.notOk(serialized.method)
    res.end()
  }
})

test('req.remoteAddress will be obtained from request socket.remoteAddress as fallback', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.socket = { remoteAddress: 'http://localhost' }
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.remoteAddress, 'http://localhost')
    res.end()
  }
})

test('req.remoteAddress will be obtained from request info.remoteAddress if available', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.info = { remoteAddress: 'http://localhost' }
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.remoteAddress, 'http://localhost')
    res.end()
  }
})

test('req.remotePort will be obtained from request socket.remotePort as fallback', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.socket = { remotePort: 3000 }
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.remotePort, 3000)
    res.end()
  }
})

test('req.remotePort will be obtained from request info.remotePort if available', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.info = { remotePort: 3000 }
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.remotePort, 3000)
    res.end()
  }
})

test('req.query is available', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.query = '/foo?bar=foobar&bar=foo'
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.query, '/foo?bar=foobar&bar=foo')
    res.end()
  }
})

test('req.params is available', function (t) {
  t.plan(1)

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.teardown(() => server.close())

  function handler (req, res) {
    req.params = '/foo/bar'
    const serialized = serializers.reqSerializer(req)
    t.equal(serialized.params, '/foo/bar')
    res.end()
  }
})
