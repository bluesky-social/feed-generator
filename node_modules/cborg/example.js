import { encode, decode } from 'cborg'

const decoded = decode(Buffer.from('a16474686973a26269736543424f522163796179f5', 'hex'))
console.log('decoded:', decoded)
console.log('encoded:', encode(decoded))
