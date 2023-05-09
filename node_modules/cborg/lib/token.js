class Type {
  /**
   * @param {number} major
   * @param {string} name
   * @param {boolean} terminal
   */
  constructor (major, name, terminal) {
    this.major = major
    this.majorEncoded = major << 5
    this.name = name
    this.terminal = terminal
  }

  /* c8 ignore next 3 */
  toString () {
    return `Type[${this.major}].${this.name}`
  }

  /**
   * @param {Type} typ
   * @returns {number}
   */
  compare (typ) {
    /* c8 ignore next 1 */
    return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0
  }
}

// convert to static fields when better supported
Type.uint = new Type(0, 'uint', true)
Type.negint = new Type(1, 'negint', true)
Type.bytes = new Type(2, 'bytes', true)
Type.string = new Type(3, 'string', true)
Type.array = new Type(4, 'array', false)
Type.map = new Type(5, 'map', false)
Type.tag = new Type(6, 'tag', false) // terminal?
Type.float = new Type(7, 'float', true)
Type.false = new Type(7, 'false', true)
Type.true = new Type(7, 'true', true)
Type.null = new Type(7, 'null', true)
Type.undefined = new Type(7, 'undefined', true)
Type.break = new Type(7, 'break', true)
// Type.indefiniteLength = new Type(0, 'indefiniteLength', true)

class Token {
  /**
   * @param {Type} type
   * @param {any} [value]
   * @param {number} [encodedLength]
   */
  constructor (type, value, encodedLength) {
    this.type = type
    this.value = value
    this.encodedLength = encodedLength
    /** @type {Uint8Array|undefined} */
    this.encodedBytes = undefined
    /** @type {Uint8Array|undefined} */
    this.byteValue = undefined
  }

  /* c8 ignore next 3 */
  toString () {
    return `Token[${this.type}].${this.value}`
  }
}

export { Type, Token }
