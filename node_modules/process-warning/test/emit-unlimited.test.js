'use strict'

const test = require('tap').test
const build = require('..')

test('emit should emit a given code unlimited times', t => {
  t.plan(50)

  const { create, emit, emitted } = build()

  let runs = 0
  const expectedRun = []
  const times = 10

  process.on('warning', onWarning)
  function onWarning (warning) {
    t.equal(warning.name, 'FastifyDeprecation')
    t.equal(warning.code, 'CODE')
    t.equal(warning.message, 'Hello world')
    t.ok(emitted.get('CODE'))
    t.equal(runs++, expectedRun.shift())
  }

  create('FastifyDeprecation', 'CODE', 'Hello world', { unlimited: true })

  for (let i = 0; i < times; i++) {
    expectedRun.push(i)
    emit('CODE')
  }
  setImmediate(() => {
    process.removeListener('warning', onWarning)
    t.end()
  })
})
