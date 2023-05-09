'use strict'

const { format } = require('util')

function processWarning () {
  const codes = {}
  const emitted = new Map()
  const opts = Object.create(null)

  function create (name, code, message, { unlimited = false } = {}) {
    if (!name) throw new Error('Warning name must not be empty')
    if (!code) throw new Error('Warning code must not be empty')
    if (!message) throw new Error('Warning message must not be empty')
    if (typeof unlimited !== 'boolean') throw new Error('Warning opts.unlimited must be a boolean')

    code = code.toUpperCase()

    if (codes[code] !== undefined) {
      throw new Error(`The code '${code}' already exist`)
    }

    function buildWarnOpts (a, b, c) {
      // more performant than spread (...) operator
      let formatted
      if (a && b && c) {
        formatted = format(message, a, b, c)
      } else if (a && b) {
        formatted = format(message, a, b)
      } else if (a) {
        formatted = format(message, a)
      } else {
        formatted = message
      }

      return {
        code,
        name,
        message: formatted
      }
    }

    Object.assign(opts, { unlimited })
    emitted.set(code, unlimited)
    codes[code] = buildWarnOpts

    return codes[code]
  }

  function emit (code, a, b, c) {
    if (emitted.get(code) === true && opts.unlimited === false) return
    if (codes[code] === undefined) throw new Error(`The code '${code}' does not exist`)
    emitted.set(code, true)

    const warning = codes[code](a, b, c)
    process.emitWarning(warning.message, warning.name, warning.code)
  }

  return {
    create,
    emit,
    emitted
  }
}

module.exports = processWarning
module.exports.default = processWarning
module.exports.processWarning = processWarning
