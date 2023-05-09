'use strict';

require('../car-browser.js');
var readerBrowser = require('../lib/reader-browser.js');
var indexer = require('../lib/indexer.js');
var iterator = require('../lib/iterator.js');
var writerBrowser = require('../lib/writer-browser.js');
var common = require('./common.js');

describe('Interface', () => {
  it('exports match', () => {
    common.assert.strictEqual(readerBrowser.CarReader, readerBrowser.CarReader);
    common.assert.strictEqual(indexer.CarIndexer, indexer.CarIndexer);
    common.assert.strictEqual(iterator.CarBlockIterator, iterator.CarBlockIterator);
    common.assert.strictEqual(iterator.CarCIDIterator, iterator.CarCIDIterator);
    common.assert.strictEqual(writerBrowser.CarWriter, writerBrowser.CarWriter);
  });
  it('browser exports', () => {
    common.assert.strictEqual(readerBrowser.__browser, globalThis.process === undefined);
  });
});
