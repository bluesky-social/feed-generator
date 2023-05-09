'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var token = require('../token.js');
var encode$1 = require('../encode.js');
var common = require('../common.js');
var byteUtils = require('../byte-utils.js');

class JSONEncoder extends Array {
  constructor() {
    super();
    this.inRecursive = [];
  }
  prefix(buf) {
    const recurs = this.inRecursive[this.inRecursive.length - 1];
    if (recurs) {
      if (recurs.type === token.Type.array) {
        recurs.elements++;
        if (recurs.elements !== 1) {
          buf.push([44]);
        }
      }
      if (recurs.type === token.Type.map) {
        recurs.elements++;
        if (recurs.elements !== 1) {
          if (recurs.elements % 2 === 1) {
            buf.push([44]);
          } else {
            buf.push([58]);
          }
        }
      }
    }
  }
  [token.Type.uint.major](buf, token) {
    this.prefix(buf);
    const is = String(token.value);
    const isa = [];
    for (let i = 0; i < is.length; i++) {
      isa[i] = is.charCodeAt(i);
    }
    buf.push(isa);
  }
  [token.Type.negint.major](buf, token$1) {
    this[token.Type.uint.major](buf, token$1);
  }
  [token.Type.bytes.major](_buf, _token) {
    throw new Error(`${ common.encodeErrPrefix } unsupported type: Uint8Array`);
  }
  [token.Type.string.major](buf, token) {
    this.prefix(buf);
    const byts = byteUtils.fromString(JSON.stringify(token.value));
    buf.push(byts.length > 32 ? byteUtils.asU8A(byts) : byts);
  }
  [token.Type.array.major](buf, _token) {
    this.prefix(buf);
    this.inRecursive.push({
      type: token.Type.array,
      elements: 0
    });
    buf.push([91]);
  }
  [token.Type.map.major](buf, _token) {
    this.prefix(buf);
    this.inRecursive.push({
      type: token.Type.map,
      elements: 0
    });
    buf.push([123]);
  }
  [token.Type.tag.major](_buf, _token) {
  }
  [token.Type.float.major](buf, token$1) {
    if (token$1.type.name === 'break') {
      const recurs = this.inRecursive.pop();
      if (recurs) {
        if (recurs.type === token.Type.array) {
          buf.push([93]);
        } else if (recurs.type === token.Type.map) {
          buf.push([125]);
        } else {
          throw new Error('Unexpected recursive type; this should not happen!');
        }
        return;
      }
      throw new Error('Unexpected break; this should not happen!');
    }
    if (token$1.value === undefined) {
      throw new Error(`${ common.encodeErrPrefix } unsupported type: undefined`);
    }
    this.prefix(buf);
    if (token$1.type.name === 'true') {
      buf.push([
        116,
        114,
        117,
        101
      ]);
      return;
    } else if (token$1.type.name === 'false') {
      buf.push([
        102,
        97,
        108,
        115,
        101
      ]);
      return;
    } else if (token$1.type.name === 'null') {
      buf.push([
        110,
        117,
        108,
        108
      ]);
      return;
    }
    const is = String(token$1.value);
    const isa = [];
    let dp = false;
    for (let i = 0; i < is.length; i++) {
      isa[i] = is.charCodeAt(i);
      if (!dp && (isa[i] === 46 || isa[i] === 101 || isa[i] === 69)) {
        dp = true;
      }
    }
    if (!dp) {
      isa.push(46);
      isa.push(48);
    }
    buf.push(isa);
  }
}
function mapSorter(e1, e2) {
  if (Array.isArray(e1[0]) || Array.isArray(e2[0])) {
    throw new Error(`${ common.encodeErrPrefix } complex map keys are not supported`);
  }
  const keyToken1 = e1[0];
  const keyToken2 = e2[0];
  if (keyToken1.type !== token.Type.string || keyToken2.type !== token.Type.string) {
    throw new Error(`${ common.encodeErrPrefix } non-string map keys are not supported`);
  }
  if (keyToken1 < keyToken2) {
    return -1;
  }
  if (keyToken1 > keyToken2) {
    return 1;
  }
  throw new Error(`${ common.encodeErrPrefix } unexpected duplicate map keys, this is not supported`);
}
const defaultEncodeOptions = {
  addBreakTokens: true,
  mapSorter
};
function encode(data, options) {
  options = Object.assign({}, defaultEncodeOptions, options);
  return encode$1.encodeCustom(data, new JSONEncoder(), options);
}

exports.encode = encode;
