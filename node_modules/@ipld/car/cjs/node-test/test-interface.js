'use strict';

require('../car.js');
var reader = require('../lib/reader.js');
var indexer = require('../lib/indexer.js');
var iterator = require('../lib/iterator.js');
var writer = require('../lib/writer.js');
var common = require('./common.js');

describe('Interface', () => {
  it('exports match', () => {
    common.assert.strictEqual(reader.CarReader, reader.CarReader);
    common.assert.strictEqual(indexer.CarIndexer, indexer.CarIndexer);
    common.assert.strictEqual(iterator.CarBlockIterator, iterator.CarBlockIterator);
    common.assert.strictEqual(iterator.CarCIDIterator, iterator.CarCIDIterator);
    common.assert.strictEqual(writer.CarWriter, writer.CarWriter);
  });
  it('browser exports', () => {
    common.assert.strictEqual(reader.__browser, globalThis.process === undefined);
  });
});
