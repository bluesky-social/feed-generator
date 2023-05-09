import { base58btc } from './bases/base58.js';
const walk = async ({cid, load, seen}) => {
  seen = seen || new Set();
  const b58Cid = cid.toString(base58btc);
  if (seen.has(b58Cid)) {
    return;
  }
  const block = await load(cid);
  seen.add(b58Cid);
  if (block === null) {
    return;
  }
  for (const [, cid] of block.links()) {
    await walk({
      cid,
      load,
      seen
    });
  }
};
export {
  walk
};