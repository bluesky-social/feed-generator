export function xor(a, b) {
  if (a.length !== b.length) {
    throw new Error('Inputs should have the same length');
  }
  const result = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}