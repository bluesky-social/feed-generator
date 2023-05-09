'use strict'

const { Suite } = require('benchmark')
const warning = require('..')()

warning.create('FastifyWarning', 'FST_ERROR_CODE_1', 'message')
warning.create('FastifyWarning', 'FST_ERROR_CODE_2', 'message')
warning.create('FastifyWarning', 'FST_ERROR_CODE_3', 'message')
new Suite()
  .add('warn', function () {
    warning.emit('FST_ERROR_CODE_1')
    warning.emit('FST_ERROR_CODE_3')
  })
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .run()
