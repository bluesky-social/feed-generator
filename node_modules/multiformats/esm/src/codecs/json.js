const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export const name = 'json';
export const code = 512;
export const encode = node => textEncoder.encode(JSON.stringify(node));
export const decode = data => JSON.parse(textDecoder.decode(data));