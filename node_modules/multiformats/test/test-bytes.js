/* globals describe, it */
import * as bytes from '../src/bytes.js'
import { assert } from 'chai'

describe('bytes', () => {
  it('isBinary', () => {
    assert.deepStrictEqual(bytes.isBinary(new ArrayBuffer(0)), true)
    assert.deepStrictEqual(bytes.isBinary(new DataView(new ArrayBuffer(0))), true)
  })

  it('coerce', () => {
    const fixture = bytes.fromString('test')
    assert.deepStrictEqual(bytes.coerce(fixture.buffer), fixture)
    assert.deepStrictEqual(bytes.coerce(new DataView(fixture.buffer)), fixture)
  })

  it('equals', () => {
    const fixture = bytes.fromString('test')
    assert.deepStrictEqual(bytes.equals(fixture, bytes.fromString('asdfadf')), false)
  })

  it('toString()', () => {
    const fixture = 'hello world'
    assert.deepStrictEqual(bytes.toString(bytes.fromString(fixture)), fixture)
  })
})
