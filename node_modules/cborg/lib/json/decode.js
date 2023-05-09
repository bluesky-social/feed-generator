import { decode as _decode } from '../decode.js'
import { Token, Type } from '../token.js'
import { decodeCodePointsArray } from '../byte-utils.js'
import { decodeErrPrefix } from '../common.js'

/**
 * @typedef {import('../../interface').DecodeOptions} DecodeOptions
 * @typedef {import('../../interface').DecodeTokenizer} DecodeTokenizer
 */

/**
 * @implements {DecodeTokenizer}
 */
class Tokenizer {
  /**
   * @param {Uint8Array} data
   * @param {DecodeOptions} options
   */
  constructor (data, options = {}) {
    this.pos = 0
    this.data = data
    this.options = options
    /** @type {string[]} */
    this.modeStack = ['value']
    this.lastToken = ''
  }

  /**
   * @returns {boolean}
   */
  done () {
    return this.pos >= this.data.length
  }

  /**
   * @returns {number}
   */
  ch () {
    return this.data[this.pos]
  }

  /**
   * @returns {string}
   */
  currentMode () {
    return this.modeStack[this.modeStack.length - 1]
  }

  skipWhitespace () {
    let c = this.ch()
    // @ts-ignore
    while (c === 32 /* ' ' */ || c === 9 /* '\t' */ || c === 13 /* '\r' */ || c === 10 /* '\n' */) {
      c = this.data[++this.pos]
    }
  }

  /**
   * @param {number[]} str
   */
  expect (str) {
    if (this.data.length - this.pos < str.length) {
      throw new Error(`${decodeErrPrefix} unexpected end of input at position ${this.pos}`)
    }
    for (let i = 0; i < str.length; i++) {
      if (this.data[this.pos++] !== str[i]) {
        throw new Error(`${decodeErrPrefix} unexpected token at position ${this.pos}, expected to find '${String.fromCharCode(...str)}'`)
      }
    }
  }

  parseNumber () {
    const startPos = this.pos
    let negative = false
    let float = false

    /**
     * @param {number[]} chars
     */
    const swallow = (chars) => {
      while (!this.done()) {
        const ch = this.ch()
        if (chars.includes(ch)) {
          this.pos++
        } else {
          break
        }
      }
    }

    // lead
    if (this.ch() === 45) { // '-'
      negative = true
      this.pos++
    }
    if (this.ch() === 48) { // '0'
      this.pos++
      if (this.ch() === 46) { // '.'
        this.pos++
        float = true
      } else {
        return new Token(Type.uint, 0, this.pos - startPos)
      }
    }
    swallow([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]) // DIGIT
    if (negative && this.pos === startPos + 1) {
      throw new Error(`${decodeErrPrefix} unexpected token at position ${this.pos}`)
    }
    if (!this.done() && this.ch() === 46) { // '.'
      if (float) {
        throw new Error(`${decodeErrPrefix} unexpected token at position ${this.pos}`)
      }
      float = true
      this.pos++
      swallow([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]) // DIGIT
    }
    if (!this.done() && (this.ch() === 101 || this.ch() === 69)) { // '[eE]'
      float = true
      this.pos++
      if (!this.done() && (this.ch() === 43 || this.ch() === 45)) { // '+', '-'
        this.pos++
      }
      swallow([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]) // DIGIT
    }
    // @ts-ignore
    const numStr = String.fromCharCode.apply(null, this.data.subarray(startPos, this.pos))
    const num = parseFloat(numStr)
    if (float) {
      return new Token(Type.float, num, this.pos - startPos)
    }
    if (this.options.allowBigInt !== true || Number.isSafeInteger(num)) {
      return new Token(num >= 0 ? Type.uint : Type.negint, num, this.pos - startPos)
    }
    return new Token(num >= 0 ? Type.uint : Type.negint, BigInt(numStr), this.pos - startPos)
  }

  /**
   * @returns {Token}
   */
  parseString () {
    /* c8 ignore next 4 */
    if (this.ch() !== 34) { // '"'
      // this would be a programming error
      throw new Error(`${decodeErrPrefix} unexpected character at position ${this.pos}; this shouldn't happen`)
    }
    this.pos++

    // check for simple fast-path, all printable ascii, no escapes
    // >0x10000 elements may fail fn.apply() (http://stackoverflow.com/a/22747272/680742)
    for (let i = this.pos, l = 0; i < this.data.length && l < 0x10000; i++, l++) {
      const ch = this.data[i]
      if (ch === 92 || ch < 32 || ch >= 128) { // '\', ' ', control-chars or non-trivial
        break
      }
      if (ch === 34) { // '"'
        // @ts-ignore
        const str = String.fromCharCode.apply(null, this.data.subarray(this.pos, i))
        this.pos = i + 1
        return new Token(Type.string, str, l)
      }
    }

    const startPos = this.pos
    const chars = []

    const readu4 = () => {
      if (this.pos + 4 >= this.data.length) {
        throw new Error(`${decodeErrPrefix} unexpected end of unicode escape sequence at position ${this.pos}`)
      }
      let u4 = 0
      for (let i = 0; i < 4; i++) {
        let ch = this.ch()
        if (ch >= 48 && ch <= 57) { // '0' && '9'
          ch -= 48
        } else if (ch >= 97 && ch <= 102) { // 'a' && 'f'
          ch = ch - 97 + 10
        } else if (ch >= 65 && ch <= 70) { // 'A' && 'F'
          ch = ch - 65 + 10
        } else {
          throw new Error(`${decodeErrPrefix} unexpected unicode escape character at position ${this.pos}`)
        }
        u4 = u4 * 16 + ch
        this.pos++
      }
      return u4
    }

    // mostly taken from feross/buffer and adjusted to fit
    const readUtf8Char = () => {
      const firstByte = this.ch()
      let codePoint = null
      /* c8 ignore next 1 */
      let bytesPerSequence = (firstByte > 0xef) ? 4 : (firstByte > 0xdf) ? 3 : (firstByte > 0xbf) ? 2 : 1

      if (this.pos + bytesPerSequence > this.data.length) {
        throw new Error(`${decodeErrPrefix} unexpected unicode sequence at position ${this.pos}`)
      }

      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        /* c8 ignore next 6 */
        // this case is dealt with by the caller function
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = this.data[this.pos + 1]
          if ((secondByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0x1f) << 0x6 | (secondByte & 0x3f)
            if (tempCodePoint > 0x7f) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = this.data[this.pos + 1]
          thirdByte = this.data[this.pos + 2]
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0xf) << 0xc | (secondByte & 0x3f) << 0x6 | (thirdByte & 0x3f)
            /* c8 ignore next 3 */
            if (tempCodePoint > 0x7ff && (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = this.data[this.pos + 1]
          thirdByte = this.data[this.pos + 2]
          fourthByte = this.data[this.pos + 3]
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80 && (fourthByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0xf) << 0x12 | (secondByte & 0x3f) << 0xc | (thirdByte & 0x3f) << 0x6 | (fourthByte & 0x3f)
            if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }

      /* c8 ignore next 5 */
      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xfffd
        bytesPerSequence = 1
      } else if (codePoint > 0xffff) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000
        chars.push(codePoint >>> 10 & 0x3ff | 0xd800)
        codePoint = 0xdc00 | codePoint & 0x3ff
      }

      chars.push(codePoint)
      this.pos += bytesPerSequence
    }

    // TODO: could take the approach of a quick first scan for special chars like encoding/json/decode.go#unquoteBytes
    // and converting all of the ascii chars from the base array in bulk
    while (!this.done()) {
      const ch = this.ch()
      let ch1
      switch (ch) {
        case 92: // '\'
          this.pos++
          if (this.done()) {
            throw new Error(`${decodeErrPrefix} unexpected string termination at position ${this.pos}`)
          }
          ch1 = this.ch()
          this.pos++
          switch (ch1) {
            case 34: // '"'
            case 39: // '\''
            case 92: // '\'
            case 47: // '/'
              chars.push(ch1)
              break
            case 98: // 'b'
              chars.push(8)
              break
            case 116: // 't'
              chars.push(9)
              break
            case 110: // 'n'
              chars.push(10)
              break
            case 102: // 'f'
              chars.push(12)
              break
            case 114: // 'r'
              chars.push(13)
              break
            case 117: // 'u'
              chars.push(readu4())
              break
            default:
              throw new Error(`${decodeErrPrefix} unexpected string escape character at position ${this.pos}`)
          }
          break
        case 34: // '"'
          this.pos++
          return new Token(Type.string, decodeCodePointsArray(chars), this.pos - startPos)
        default:
          if (ch < 32) { // ' '
            throw new Error(`${decodeErrPrefix} invalid control character at position ${this.pos}`)
          } else if (ch < 0x80) {
            chars.push(ch)
            this.pos++
          } else {
            readUtf8Char()
          }
      }
    }

    throw new Error(`${decodeErrPrefix} unexpected end of string at position ${this.pos}`)
  }

  /**
   * @returns {Token}
   */
  parseValue () {
    switch (this.ch()) {
      case 123: // '{'
        this.modeStack.push('obj-start')
        this.pos++
        return new Token(Type.map, Infinity, 1)
      case 91: // '['
        this.modeStack.push('array-start')
        this.pos++
        return new Token(Type.array, Infinity, 1)
      case 34: { // '"'
        return this.parseString()
      }
      case 110: // 'n' / null
        this.expect([110, 117, 108, 108]) // 'null'
        return new Token(Type.null, null, 4)
      case 102: // 'f' / // false
        this.expect([102, 97, 108, 115, 101]) // 'false'
        return new Token(Type.false, false, 5)
      case 116: // 't' / // true
        this.expect([116, 114, 117, 101]) // 'true'
        return new Token(Type.true, true, 4)
      case 45: // '-'
      case 48: // '0'
      case 49: // '1'
      case 50: // '2'
      case 51: // '3'
      case 52: // '4'
      case 53: // '5'
      case 54: // '6'
      case 55: // '7'
      case 56: // '8'
      case 57: // '9'
        return this.parseNumber()
      default:
        throw new Error(`${decodeErrPrefix} unexpected character at position ${this.pos}`)
    }
  }

  /**
   * @returns {Token}
   */
  next () {
    this.skipWhitespace()
    switch (this.currentMode()) {
      case 'value':
        this.modeStack.pop()
        return this.parseValue()
      case 'array-value': {
        this.modeStack.pop()
        if (this.ch() === 93) { // ']'
          this.pos++
          this.skipWhitespace()
          return new Token(Type.break, undefined, 1)
        }
        if (this.ch() !== 44) { // ','
          throw new Error(`${decodeErrPrefix} unexpected character at position ${this.pos}, was expecting array delimiter but found '${String.fromCharCode(this.ch())}'`)
        }
        this.pos++
        this.modeStack.push('array-value')
        this.skipWhitespace()
        return this.parseValue()
      }
      case 'array-start': {
        this.modeStack.pop()
        if (this.ch() === 93) { // ']'
          this.pos++
          this.skipWhitespace()
          return new Token(Type.break, undefined, 1)
        }
        this.modeStack.push('array-value')
        this.skipWhitespace()
        return this.parseValue()
      }
      // @ts-ignore
      case 'obj-key':
        if (this.ch() === 125) { // '}'
          this.modeStack.pop()
          this.pos++
          this.skipWhitespace()
          return new Token(Type.break, undefined, 1)
        }
        if (this.ch() !== 44) { // ','
          throw new Error(`${decodeErrPrefix} unexpected character at position ${this.pos}, was expecting object delimiter but found '${String.fromCharCode(this.ch())}'`)
        }
        this.pos++
        this.skipWhitespace()
      case 'obj-start': { // eslint-disable-line no-fallthrough
        this.modeStack.pop()
        if (this.ch() === 125) { // '}'
          this.pos++
          this.skipWhitespace()
          return new Token(Type.break, undefined, 1)
        }
        const token = this.parseString()
        this.skipWhitespace()
        if (this.ch() !== 58) { // ':'
          throw new Error(`${decodeErrPrefix} unexpected character at position ${this.pos}, was expecting key/value delimiter ':' but found '${String.fromCharCode(this.ch())}'`)
        }
        this.pos++
        this.modeStack.push('obj-value')
        return token
      }
      case 'obj-value': {
        this.modeStack.pop()
        this.modeStack.push('obj-key')
        this.skipWhitespace()
        return this.parseValue()
      }
      /* c8 ignore next 2 */
      default:
        throw new Error(`${decodeErrPrefix} unexpected parse state at position ${this.pos}; this shouldn't happen`)
    }
  }
}

/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {any}
 */
function decode (data, options) {
  options = Object.assign({ tokenizer: new Tokenizer(data, options) }, options)
  return _decode(data, options)
}

export { decode, Tokenizer }
