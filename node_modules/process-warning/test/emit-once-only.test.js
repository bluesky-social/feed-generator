'use strict'

const test = require('tap').test
const build = require('..')

test('emit should emit a given code only once', t => {
  t.plan(4)

  const { create, emit, emitted } = build()

  process.on('warning', onWarning)
  function onWarning (warning) {
    t.equal(warning.name, 'FastifyDeprecation')
    t.equal(warning.code, 'CODE')
    t.equal(warning.message, 'Hello world')
    t.ok(emitted.get('CODE'))
  }

  create('FastifyDeprecation', 'CODE', 'Hello world')
  emit('CODE')
  emit('CODE')
  setImmediate(() => {
    process.removeListener('warning', onWarning)
    t.end()
  })
})
