function noop() {
}
export function create() {
  const chunkQueue = [];
  let drainer = null;
  let drainerResolver = noop;
  let ended = false;
  let outWait = null;
  let outWaitResolver = noop;
  const makeDrainer = () => {
    if (!drainer) {
      drainer = new Promise(resolve => {
        drainerResolver = () => {
          drainer = null;
          drainerResolver = noop;
          resolve();
        };
      });
    }
    return drainer;
  };
  const writer = {
    write(chunk) {
      chunkQueue.push(chunk);
      const drainer = makeDrainer();
      outWaitResolver();
      return drainer;
    },
    async end() {
      ended = true;
      const drainer = makeDrainer();
      outWaitResolver();
      return drainer;
    }
  };
  const iterator = {
    async next() {
      const chunk = chunkQueue.shift();
      if (chunk) {
        if (chunkQueue.length === 0) {
          drainerResolver();
        }
        return {
          done: false,
          value: chunk
        };
      }
      if (ended) {
        drainerResolver();
        return {
          done: true,
          value: undefined
        };
      }
      if (!outWait) {
        outWait = new Promise(resolve => {
          outWaitResolver = () => {
            outWait = null;
            outWaitResolver = noop;
            return resolve(iterator.next());
          };
        });
      }
      return outWait;
    }
  };
  return {
    writer,
    iterator
  };
}