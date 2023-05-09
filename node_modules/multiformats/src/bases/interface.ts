// Base encoders / decoders just base encode / decode between binary and
// textual representation. They are unaware of multibase.

/**
 * Base encoder just encodes bytes into base encoded string.
 */
export interface BaseEncoder {
  /**
   * Base encodes to a **plain** (and not a multibase) string. Unlike
   * `encode` no multibase prefix is added.
   * @param bytes
   */
  baseEncode(bytes: Uint8Array): string
}

/**
 * Base decoder decodes encoded with matching base encoding into bytes.
 */
export interface BaseDecoder {
  /**
   * Decodes **plain** (and not a multibase) string. Unlike
   * decode
   * @param text
   */
  baseDecode(text: string): Uint8Array
}

/**
 * Base codec is just dual of encoder and decoder.
 */
export interface BaseCodec {
  encoder: BaseEncoder
  decoder: BaseDecoder
}

/**
 * Multibase represents base encoded strings with a prefix first character
 * describing it's encoding.
 */
export type Multibase<Prefix extends string> =
  | string
  | string & { [0]: Prefix }

/**
 * Multibase encoder for the specific base encoding encodes bytes into
 * multibase of that encoding.
 */
export interface MultibaseEncoder<Prefix extends string> {
  /**
   * Name of the encoding.
   */
  name: string
  /**
   * Prefix character for that base encoding.
   */
  prefix: Prefix
  /**
   * Encodes binary data into **multibase** string (which will have a
   * prefix added).
   */
  encode(bytes: Uint8Array): Multibase<Prefix>
}

/**
 * Interface implemented by multibase decoder, that takes multibase strings
 * to bytes. It may support single encoding like base32 or multiple encodings
 * like base32, base58btc, base64. If passed multibase is incompatible it will
 * throw an exception.
 */
export interface MultibaseDecoder<Prefix extends string> {
  /**
   * Decodes **multibase** string (which must have a multibase prefix added).
   * If prefix does not match
   * @param multibase
   */
  decode(multibase: Multibase<Prefix>): Uint8Array
}

/**
 * Dual of multibase encoder and decoder.
 */
export interface MultibaseCodec<Prefix extends string> {
  name: string
  prefix: Prefix
  encoder: MultibaseEncoder<Prefix>
  decoder: MultibaseDecoder<Prefix>
}


export interface UnibaseDecoder<Prefix extends string> extends MultibaseDecoder<Prefix> {
  // Reserve this property so it can be used to derive type.
  readonly decoders?: null

  readonly prefix: Prefix
}

export interface CombobaseDecoder<Prefix extends string> extends MultibaseDecoder<Prefix> {
  readonly decoders: Record<Prefix, UnibaseDecoder<Prefix>>
}
