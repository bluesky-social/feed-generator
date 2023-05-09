import { garbage } from 'ipld-garbage';
import {
  decode,
  encode
} from '../cborg.js';
import chai from 'chai';
const {assert} = chai;
describe('Fuzz round-trip', () => {
  it('random objects', function () {
    this.timeout(5000);
    for (let i = 0; i < 1000; i++) {
      const obj = garbage(300, { weights: { CID: 0 } });
      const byts = encode(obj);
      const decoded = decode(byts);
      assert.deepEqual(decoded, obj);
    }
  });
  it('circular references error', () => {
    let obj = {};
    obj.obj = obj;
    assert.throws(() => encode(obj), /circular references/);
    obj = {
      blip: [
        1,
        2,
        { blop: {} }
      ]
    };
    obj.blip[2].blop.boop = obj;
    assert.throws(() => encode(obj), /circular references/);
    obj = {
      blip: [
        1,
        2,
        { blop: {} }
      ]
    };
    obj.blip[2].blop.boop = obj.blip;
    assert.throws(() => encode(obj), /circular references/);
    obj = {
      blip: {},
      bloop: {}
    };
    obj.bloop = obj.blip;
    assert.doesNotThrow(() => encode(obj));
    const arr = [];
    arr[0] = arr;
    assert.throws(() => encode(arr), /circular references/);
  });
});