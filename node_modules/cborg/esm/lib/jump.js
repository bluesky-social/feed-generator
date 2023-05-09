import {
  Token,
  Type
} from './token.js';
import * as uint from './0uint.js';
import * as negint from './1negint.js';
import * as bytes from './2bytes.js';
import * as string from './3string.js';
import * as array from './4array.js';
import * as map from './5map.js';
import * as tag from './6tag.js';
import * as float from './7float.js';
import { decodeErrPrefix } from './common.js';
import { fromArray } from './byte-utils.js';
function invalidMinor(data, pos, minor) {
  throw new Error(`${ decodeErrPrefix } encountered invalid minor (${ minor }) for major ${ data[pos] >>> 5 }`);
}
function errorer(msg) {
  return () => {
    throw new Error(`${ decodeErrPrefix } ${ msg }`);
  };
}
export const jump = [];
for (let i = 0; i <= 23; i++) {
  jump[i] = invalidMinor;
}
jump[24] = uint.decodeUint8;
jump[25] = uint.decodeUint16;
jump[26] = uint.decodeUint32;
jump[27] = uint.decodeUint64;
jump[28] = invalidMinor;
jump[29] = invalidMinor;
jump[30] = invalidMinor;
jump[31] = invalidMinor;
for (let i = 32; i <= 55; i++) {
  jump[i] = invalidMinor;
}
jump[56] = negint.decodeNegint8;
jump[57] = negint.decodeNegint16;
jump[58] = negint.decodeNegint32;
jump[59] = negint.decodeNegint64;
jump[60] = invalidMinor;
jump[61] = invalidMinor;
jump[62] = invalidMinor;
jump[63] = invalidMinor;
for (let i = 64; i <= 87; i++) {
  jump[i] = bytes.decodeBytesCompact;
}
jump[88] = bytes.decodeBytes8;
jump[89] = bytes.decodeBytes16;
jump[90] = bytes.decodeBytes32;
jump[91] = bytes.decodeBytes64;
jump[92] = invalidMinor;
jump[93] = invalidMinor;
jump[94] = invalidMinor;
jump[95] = errorer('indefinite length bytes/strings are not supported');
for (let i = 96; i <= 119; i++) {
  jump[i] = string.decodeStringCompact;
}
jump[120] = string.decodeString8;
jump[121] = string.decodeString16;
jump[122] = string.decodeString32;
jump[123] = string.decodeString64;
jump[124] = invalidMinor;
jump[125] = invalidMinor;
jump[126] = invalidMinor;
jump[127] = errorer('indefinite length bytes/strings are not supported');
for (let i = 128; i <= 151; i++) {
  jump[i] = array.decodeArrayCompact;
}
jump[152] = array.decodeArray8;
jump[153] = array.decodeArray16;
jump[154] = array.decodeArray32;
jump[155] = array.decodeArray64;
jump[156] = invalidMinor;
jump[157] = invalidMinor;
jump[158] = invalidMinor;
jump[159] = array.decodeArrayIndefinite;
for (let i = 160; i <= 183; i++) {
  jump[i] = map.decodeMapCompact;
}
jump[184] = map.decodeMap8;
jump[185] = map.decodeMap16;
jump[186] = map.decodeMap32;
jump[187] = map.decodeMap64;
jump[188] = invalidMinor;
jump[189] = invalidMinor;
jump[190] = invalidMinor;
jump[191] = map.decodeMapIndefinite;
for (let i = 192; i <= 215; i++) {
  jump[i] = tag.decodeTagCompact;
}
jump[216] = tag.decodeTag8;
jump[217] = tag.decodeTag16;
jump[218] = tag.decodeTag32;
jump[219] = tag.decodeTag64;
jump[220] = invalidMinor;
jump[221] = invalidMinor;
jump[222] = invalidMinor;
jump[223] = invalidMinor;
for (let i = 224; i <= 243; i++) {
  jump[i] = errorer('simple values are not supported');
}
jump[244] = invalidMinor;
jump[245] = invalidMinor;
jump[246] = invalidMinor;
jump[247] = float.decodeUndefined;
jump[248] = errorer('simple values are not supported');
jump[249] = float.decodeFloat16;
jump[250] = float.decodeFloat32;
jump[251] = float.decodeFloat64;
jump[252] = invalidMinor;
jump[253] = invalidMinor;
jump[254] = invalidMinor;
jump[255] = float.decodeBreak;
export const quick = [];
for (let i = 0; i < 24; i++) {
  quick[i] = new Token(Type.uint, i, 1);
}
for (let i = -1; i >= -24; i--) {
  quick[31 - i] = new Token(Type.negint, i, 1);
}
quick[64] = new Token(Type.bytes, new Uint8Array(0), 1);
quick[96] = new Token(Type.string, '', 1);
quick[128] = new Token(Type.array, 0, 1);
quick[160] = new Token(Type.map, 0, 1);
quick[244] = new Token(Type.false, false, 1);
quick[245] = new Token(Type.true, true, 1);
quick[246] = new Token(Type.null, null, 1);
export function quickEncodeToken(token) {
  switch (token.type) {
  case Type.false:
    return fromArray([244]);
  case Type.true:
    return fromArray([245]);
  case Type.null:
    return fromArray([246]);
  case Type.bytes:
    if (!token.value.length) {
      return fromArray([64]);
    }
    return;
  case Type.string:
    if (token.value === '') {
      return fromArray([96]);
    }
    return;
  case Type.array:
    if (token.value === 0) {
      return fromArray([128]);
    }
    return;
  case Type.map:
    if (token.value === 0) {
      return fromArray([160]);
    }
    return;
  case Type.uint:
    if (token.value < 24) {
      return fromArray([Number(token.value)]);
    }
    return;
  case Type.negint:
    if (token.value >= -24) {
      return fromArray([31 - Number(token.value)]);
    }
  }
}