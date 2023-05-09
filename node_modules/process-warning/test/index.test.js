'use strict'

const test = require('tap').test
const build = require('..')

process.removeAllListeners('warning')

test('Create warning with zero parameter', t => {
  t.plan(3)

  const { create } = build()
  const buildWarnOpts = create('FastifyWarning', 'CODE', 'Not available')
  const opts = buildWarnOpts()
  t.equal(opts.name, 'FastifyWarning')
  t.equal(opts.message, 'Not available')
  t.equal(opts.code, 'CODE')
})

test('Create error with 1 parameter', t => {
  t.plan(3)

  const { create } = build()
  const buildWarningOpts = create('FastifyWarning', 'CODE', 'hey %s')
  const opts = buildWarningOpts('alice')
  t.equal(opts.name, 'FastifyWarning')
  t.equal(opts.message, 'hey alice')
  t.equal(opts.code, 'CODE')
})

test('Create error with 2 parameters', t => {
  t.plan(3)

  const { create } = build()
  const buildWarnOpts = create('FastifyWarning', 'CODE', 'hey %s, I like your %s')
  const opts = buildWarnOpts('alice', 'attitude')
  t.equal(opts.name, 'FastifyWarning')
  t.equal(opts.message, 'hey alice, I like your attitude')
  t.equal(opts.code, 'CODE')
})

test('Create error with 3 parameters', t => {
  t.plan(3)

  const { create } = build()
  const buildWarnOpts = create('FastifyWarning', 'CODE', 'hey %s, I like your %s %s')
  const opts = buildWarnOpts('alice', 'attitude', 'see you')
  t.equal(opts.name, 'FastifyWarning')
  t.equal(opts.message, 'hey alice, I like your attitude see you')
  t.equal(opts.code, 'CODE')
})

test('Should throw when error code has no fastify name', t => {
  t.plan(1)

  const { create } = build()

  t.throws(() => create(), new Error('Warning name must not be empty'))
})

test('Should throw when error has no code', t => {
  t.plan(1)

  const { create } = build()

  t.throws(() => create('name'), new Error('Warning code must not be empty'))
})

test('Should throw when error has no message', t => {
  t.plan(1)

  const { create } = build()

  t.throws(() => create('name', 'code'), new Error('Warning message must not be empty'))
})

test('Should throw if emit is called with unknown code ', t => {
  t.plan(1)

  const { emit } = build()

  t.throws(() => emit('CODE'), new Error('The code \'CODE\' does not exist'))
})

test('Cannot reuse the same code more than once', t => {
  t.plan(1)

  const { create } = build()
  create('FastifyWarning', 'CODE', 'Not available')

  t.throws(() => create('FastifyWarning', 'CODE', 'Not available'), new Error("The code 'CODE' already exist"))
})

test('Cannot set unlimited other than boolean', t => {
  t.plan(1)

  const { create } = build()

  t.throws(() => create('FastifyWarning', 'CODE', 'Msg', { unlimited: 42 }), new Error('Warning opts.unlimited must be a boolean'))
})
