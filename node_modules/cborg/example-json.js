import { encode, decode } from 'cborg/json'

const decoded = decode(Buffer.from('7b2274686973223a7b226973223a224a534f4e21222c22796179223a747275657d7d', 'hex'))
console.log('decoded:', decoded)
console.log('encoded:', encode(decoded))
console.log('encoded (string):', Buffer.from(encode(decoded)).toString())
