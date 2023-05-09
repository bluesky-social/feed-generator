import * as car from '../car-browser.js';
import {
  CarReader,
  __browser
} from '../lib/reader-browser.js';
import { CarIndexer } from '../lib/indexer.js';
import {
  CarBlockIterator,
  CarCIDIterator
} from '../lib/iterator.js';
import { CarWriter } from '../lib/writer-browser.js';
import { assert } from './common.js';
describe('Interface', () => {
  it('exports match', () => {
    assert.strictEqual(car.CarReader, CarReader);
    assert.strictEqual(car.CarIndexer, CarIndexer);
    assert.strictEqual(car.CarBlockIterator, CarBlockIterator);
    assert.strictEqual(car.CarCIDIterator, CarCIDIterator);
    assert.strictEqual(car.CarWriter, CarWriter);
  });
  it('browser exports', () => {
    assert.strictEqual(__browser, globalThis.process === undefined);
  });
});