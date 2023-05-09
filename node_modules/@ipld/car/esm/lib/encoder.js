import varint from 'varint';
import { encode as dagCborEncode } from '@ipld/dag-cbor';
export function createHeader(roots) {
  const headerBytes = dagCborEncode({
    version: 1,
    roots
  });
  const varintBytes = varint.encode(headerBytes.length);
  const header = new Uint8Array(varintBytes.length + headerBytes.length);
  header.set(varintBytes, 0);
  header.set(headerBytes, varintBytes.length);
  return header;
}
function createEncoder(writer) {
  return {
    async setRoots(roots) {
      const bytes = createHeader(roots);
      await writer.write(bytes);
    },
    async writeBlock(block) {
      const {cid, bytes} = block;
      await writer.write(new Uint8Array(varint.encode(cid.bytes.length + bytes.length)));
      await writer.write(cid.bytes);
      if (bytes.length) {
        await writer.write(bytes);
      }
    },
    async close() {
      return writer.end();
    }
  };
}
export {
  createEncoder
};