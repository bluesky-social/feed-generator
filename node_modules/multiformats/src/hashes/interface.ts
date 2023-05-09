// # Multihash

/**
 * Represents a multihash digest which carries information about the
 * hashing algorithm and an actual hash digest.
 */
// Note: In the current version there is no first class multihash
// representation (plain Uint8Array is used instead) instead there seems to be
// a bunch of places that parse it to extract (code, digest, size). By creating
// this first class representation we avoid reparsing and things generally fit
// really nicely.
export interface MultihashDigest<Code extends number = number> {
  /**
   * Code of the multihash
   */
  code: Code

  /**
   * Raw digest (without a hashing algorithm info)
   */
  digest: Uint8Array

  /**
   * byte length of the `this.digest`
   */
  size: number

  /**
   * Binary representation of this multihash digest.
   */
  bytes: Uint8Array
}

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 */
export interface MultihashHasher<Code extends number = number> {
  /**
   * Takes binary `input` and returns it (multi) hash digest. Return value is
   * either promise of a digest or a digest. This way general use can `await`
   * while performance critical code may asses return value to decide whether
   * await is needed.
   *
   * @param {Uint8Array} input
   */
  digest(input: Uint8Array): Promise<MultihashDigest> | MultihashDigest

  /**
   * Name of the multihash
   */
  name: string

  /**
   * Code of the multihash
   */
  code: Code
}

/**
 * Sync variant of `MultihashHasher` that refines return type of the `digest`
 * to `MultihashDigest`. It is subtype of `MultihashHasher` so implementations
 * of this interface can be passed anywhere `MultihashHasher` is expected,
 * allowing consumer to either `await` or check the return type to decide
 * whether to await or proceed with return value.
 *
 * `SyncMultihashHasher` is useful in certain APIs where async hashing would be
 * impractical e.g. implementation of Hash Array Mapped Trie (HAMT).
 */
export interface SyncMultihashHasher<Code extends number = number> extends MultihashHasher<Code> {
  digest(input: Uint8Array): MultihashDigest
}
