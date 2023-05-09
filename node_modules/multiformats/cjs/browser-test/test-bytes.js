'use strict';

var bytes = require('../src/bytes.js');
var chai = require('chai');

describe('bytes', () => {
  it('isBinary', () => {
    chai.assert.deepStrictEqual(bytes.isBinary(new ArrayBuffer(0)), true);
    chai.assert.deepStrictEqual(bytes.isBinary(new DataView(new ArrayBuffer(0))), true);
  });
  it('coerce', () => {
    const fixture = bytes.fromString('test');
    chai.assert.deepStrictEqual(bytes.coerce(fixture.buffer), fixture);
    chai.assert.deepStrictEqual(bytes.coerce(new DataView(fixture.buffer)), fixture);
  });
  it('equals', () => {
    const fixture = bytes.fromString('test');
    chai.assert.deepStrictEqual(bytes.equals(fixture, bytes.fromString('asdfadf')), false);
  });
  it('toString()', () => {
    const fixture = 'hello world';
    chai.assert.deepStrictEqual(bytes.toString(bytes.fromString(fixture)), fixture);
  });
});
