import { varint } from '../src/index.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const {assert} = chai;
const UTF8 = new TextEncoder();
describe('varint', () => {
  it('can decode with offset', () => {
    const message = UTF8.encode('hello-world');
    const outerTag = 85;
    const innerTag = 227;
    const outerTagSize = varint.encodingLength(outerTag);
    const innerTagSize = varint.encodingLength(innerTag);
    const bytes = new Uint8Array(message.byteLength + outerTagSize + innerTagSize);
    varint.encodeTo(outerTag, bytes);
    varint.encodeTo(innerTag, bytes, outerTagSize);
    bytes.set(message, outerTagSize + innerTagSize);
    assert.deepStrictEqual(varint.decode(bytes), [
      outerTag,
      outerTagSize
    ]);
    assert.deepStrictEqual(varint.decode(bytes, outerTagSize), [
      innerTag,
      innerTagSize
    ]);
  });
});