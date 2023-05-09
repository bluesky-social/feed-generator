import varint from '../vendor/varint.js';
export const decode = (data, offset = 0) => {
  const code = varint.decode(data, offset);
  return [
    code,
    varint.decode.bytes
  ];
};
export const encodeTo = (int, target, offset = 0) => {
  varint.encode(int, target, offset);
  return target;
};
export const encodingLength = int => {
  return varint.encodingLength(int);
};