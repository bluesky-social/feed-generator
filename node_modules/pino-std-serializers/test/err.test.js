'use strict'

const test = require('tap').test
const serializer = require('../lib/err')
const wrapErrorSerializer = require('../').wrapErrorSerializer

test('serializes Error objects', function (t) {
  t.plan(3)
  const serialized = serializer(Error('foo'))
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.match(serialized.stack, /err\.test\.js:/)
})

test('serializes Error objects with extra properties', function (t) {
  t.plan(5)
  const err = Error('foo')
  err.statusCode = 500
  const serialized = serializer(err)
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.ok(serialized.statusCode)
  t.equal(serialized.statusCode, 500)
  t.match(serialized.stack, /err\.test\.js:/)
})

test('serializes Error objects with subclass "type"', function (t) {
  t.plan(1)
  class MyError extends Error {}
  const err = new MyError('foo')
  const serialized = serializer(err)
  t.equal(serialized.type, 'MyError')
})

test('serializes nested errors', function (t) {
  t.plan(7)
  const err = Error('foo')
  err.inner = Error('bar')
  const serialized = serializer(err)
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.match(serialized.stack, /err\.test\.js:/)
  t.equal(serialized.inner.type, 'Error')
  t.equal(serialized.inner.message, 'bar')
  t.match(serialized.inner.stack, /Error: bar/)
  t.match(serialized.inner.stack, /err\.test\.js:/)
})

test('serializes error causes', function (t) {
  t.plan(14)
  for (const cause of [
    Error('bar'),
    { message: 'bar', stack: 'Error: bar: err.test.js:' }
  ]) {
    const err = Error('foo')
    err.cause = cause
    err.cause.cause = Error('abc')
    const serialized = serializer(err)
    t.equal(serialized.type, 'Error')
    t.equal(serialized.message, 'foo: bar: abc')
    t.match(serialized.stack, /err\.test\.js:/)
    t.match(serialized.stack, /Error: foo/)
    t.match(serialized.stack, /Error: bar/)
    t.match(serialized.stack, /Error: abc/)
    t.notOk(serialized.cause)
  }
})

test('serializes error causes with VError support', function (t) {
  t.plan(6)
  // Fake VError-style setup
  const err = Error('foo: bar')
  err.foo = 'abc'
  err.cause = function () {
    const err = Error('bar')
    err.cause = Error(this.foo)
    return err
  }
  const serialized = serializer(err)
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo: bar: abc')
  t.match(serialized.stack, /err\.test\.js:/)
  t.match(serialized.stack, /Error: foo/)
  t.match(serialized.stack, /Error: bar/)
  t.match(serialized.stack, /Error: abc/)
})

test('keeps non-error cause', function (t) {
  t.plan(3)
  const err = Error('foo')
  err.cause = 'abc'
  const serialized = serializer(err)
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.equal(serialized.cause, 'abc')
})

test('prevents infinite recursion', function (t) {
  t.plan(4)
  const err = Error('foo')
  err.inner = err
  const serialized = serializer(err)
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.match(serialized.stack, /err\.test\.js:/)
  t.notOk(serialized.inner)
})

test('cleans up infinite recursion tracking', function (t) {
  t.plan(8)
  const err = Error('foo')
  const bar = Error('bar')
  err.inner = bar
  bar.inner = err

  serializer(err)
  const serialized = serializer(err)

  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.match(serialized.stack, /err\.test\.js:/)
  t.ok(serialized.inner)
  t.equal(serialized.inner.type, 'Error')
  t.equal(serialized.inner.message, 'bar')
  t.match(serialized.inner.stack, /Error: bar/)
  t.notOk(serialized.inner.inner)
})

test('err.raw is available', function (t) {
  t.plan(1)
  const err = Error('foo')
  const serialized = serializer(err)
  t.equal(serialized.raw, err)
})

test('redefined err.constructor doesnt crash serializer', function (t) {
  t.plan(10)

  function check (a, name) {
    t.equal(a.type, name)
    t.equal(a.message, 'foo')
  }

  const err1 = TypeError('foo')
  err1.constructor = '10'

  const err2 = TypeError('foo')
  err2.constructor = undefined

  const err3 = Error('foo')
  err3.constructor = null

  const err4 = Error('foo')
  err4.constructor = 10

  class MyError extends Error {}
  const err5 = new MyError('foo')
  err5.constructor = undefined

  check(serializer(err1), 'TypeError')
  check(serializer(err2), 'TypeError')
  check(serializer(err3), 'Error')
  check(serializer(err4), 'Error')
  // We do not expect 'MyError' because err5.constructor has been blown away.
  // `err5.name` is 'Error' from the base class prototype.
  check(serializer(err5), 'Error')
})

test('pass through anything that does not look like an Error', function (t) {
  t.plan(3)

  function check (a) {
    t.equal(serializer(a), a)
  }

  check('foo')
  check({ hello: 'world' })
  check([1, 2])
})

test('can wrap err serializers', function (t) {
  t.plan(5)
  const err = Error('foo')
  err.foo = 'foo'
  const serializer = wrapErrorSerializer(function (err) {
    delete err.foo
    err.bar = 'bar'
    return err
  })
  const serialized = serializer(err)
  t.equal(serialized.type, 'Error')
  t.equal(serialized.message, 'foo')
  t.match(serialized.stack, /err\.test\.js:/)
  t.notOk(serialized.foo)
  t.equal(serialized.bar, 'bar')
})

test('serializes aggregate errors', { skip: !global.AggregateError }, function (t) {
  t.plan(14)
  const foo = new Error('foo')
  const bar = new Error('bar')
  for (const aggregate of [
    new AggregateError([foo, bar], 'aggregated message'), // eslint-disable-line no-undef
    { errors: [foo, bar], message: 'aggregated message', stack: 'err.test.js:' }
  ]) {
    const serialized = serializer(aggregate)
    t.equal(serialized.message, 'aggregated message')
    t.equal(serialized.aggregateErrors.length, 2)
    t.equal(serialized.aggregateErrors[0].message, 'foo')
    t.equal(serialized.aggregateErrors[1].message, 'bar')
    t.match(serialized.aggregateErrors[0].stack, /^Error: foo/)
    t.match(serialized.aggregateErrors[1].stack, /^Error: bar/)
    t.match(serialized.stack, /err\.test\.js:/)
  }
})
