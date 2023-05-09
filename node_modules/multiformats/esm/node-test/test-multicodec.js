import * as bytes from '../src/bytes.js';
import * as raw from '../src/codecs/raw.js';
import * as json from '../src/codecs/json.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const {assert} = chai;
describe('multicodec', () => {
  it('encode/decode raw', () => {
    const buff = raw.encode(bytes.fromString('test'));
    assert.deepStrictEqual(buff, bytes.fromString('test'));
    assert.deepStrictEqual(raw.decode(buff), bytes.fromString('test'));
  });
  it('encode/decode json', () => {
    const buff = json.encode({ hello: 'world' });
    assert.deepStrictEqual(buff, bytes.fromString(JSON.stringify({ hello: 'world' })));
    assert.deepStrictEqual(json.decode(buff), { hello: 'world' });
  });
  it('raw cannot encode string', async () => {
    assert.throws(() => raw.encode('asdf'), 'Unknown type, must be binary type');
  });
});