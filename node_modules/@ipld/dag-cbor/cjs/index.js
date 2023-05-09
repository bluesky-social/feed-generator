'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cborg = require('cborg');
var cid = require('multiformats/cid');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var cborg__namespace = /*#__PURE__*/_interopNamespace(cborg);

const CID_CBOR_TAG = 42;
function cidEncoder(obj) {
  if (obj.asCID !== obj) {
    return null;
  }
  const cid$1 = cid.CID.asCID(obj);
  if (!cid$1) {
    return null;
  }
  const bytes = new Uint8Array(cid$1.bytes.byteLength + 1);
  bytes.set(cid$1.bytes, 1);
  return [
    new cborg__namespace.Token(cborg__namespace.Type.tag, CID_CBOR_TAG),
    new cborg__namespace.Token(cborg__namespace.Type.bytes, bytes)
  ];
}
function undefinedEncoder() {
  throw new Error('`undefined` is not supported by the IPLD Data Model and cannot be encoded');
}
function numberEncoder(num) {
  if (Number.isNaN(num)) {
    throw new Error('`NaN` is not supported by the IPLD Data Model and cannot be encoded');
  }
  if (num === Infinity || num === -Infinity) {
    throw new Error('`Infinity` and `-Infinity` is not supported by the IPLD Data Model and cannot be encoded');
  }
  return null;
}
const encodeOptions = {
  float64: true,
  typeEncoders: {
    Object: cidEncoder,
    undefined: undefinedEncoder,
    number: numberEncoder
  }
};
function cidDecoder(bytes) {
  if (bytes[0] !== 0) {
    throw new Error('Invalid CID for CBOR tag 42; expected leading 0x00');
  }
  return cid.CID.decode(bytes.subarray(1));
}
const decodeOptions = {
  allowIndefinite: false,
  coerceUndefinedToNull: true,
  allowNaN: false,
  allowInfinity: false,
  allowBigInt: true,
  strict: true,
  useMaps: false,
  tags: []
};
decodeOptions.tags[CID_CBOR_TAG] = cidDecoder;
const name = 'dag-cbor';
const code = 113;
const encode = node => cborg__namespace.encode(node, encodeOptions);
const decode = data => cborg__namespace.decode(data, decodeOptions);

exports.code = code;
exports.decode = decode;
exports.encode = encode;
exports.name = name;
