// Copyright 2018 Consensys AG

// Licensed under the Apache License, Version 2.0(the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Defines an object type that can be extended with other properties.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Extensible = Record<string, any>

/**
 * Defines the result of a DID resolution operation.
 *
 * @see {@link Resolvable.resolve}
 * @see {@link https://www.w3.org/TR/did-core/#did-resolution}
 */
export interface DIDResolutionResult {
  '@context'?: 'https://w3id.org/did-resolution/v1' | string | string[]
  didResolutionMetadata: DIDResolutionMetadata
  didDocument: DIDDocument | null
  didDocumentMetadata: DIDDocumentMetadata
}

/**
 * Describes the options forwarded to the resolver when executing a {@link Resolvable.resolve} operation.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-resolution-options}
 */
export interface DIDResolutionOptions extends Extensible {
  accept?: string
}

/**
 * Encapsulates the resolution metadata resulting from a {@link Resolvable.resolve} operation.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-resolution-metadata}
 */
export interface DIDResolutionMetadata extends Extensible {
  contentType?: string
  error?: 'invalidDid' | 'notFound' | 'representationNotSupported' | 'unsupportedDidMethod' | string
}

/**
 * Represents metadata about the DID document resulting from a {@link Resolvable.resolve} operation.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-document-metadata}
 */
export interface DIDDocumentMetadata extends Extensible {
  created?: string
  updated?: string
  deactivated?: boolean
  versionId?: string
  nextUpdate?: string
  nextVersionId?: string
  equivalentId?: string
  canonicalId?: string
}

/**
 * Represents the Verification Relationship between a DID subject and a Verification Method.
 *
 * @see {@link https://www.w3.org/TR/did-core/#verification-relationships}
 */
export type KeyCapabilitySection =
  | 'authentication'
  | 'assertionMethod'
  | 'keyAgreement'
  | 'capabilityInvocation'
  | 'capabilityDelegation'

/**
 * Represents a DID document.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-document-properties}
 */
export type DIDDocument = {
  '@context'?: 'https://www.w3.org/ns/did/v1' | string | string[]
  id: string
  alsoKnownAs?: string[]
  controller?: string | string[]
  verificationMethod?: VerificationMethod[]
  service?: Service[]
  /**
   * @deprecated
   */
  publicKey?: VerificationMethod[]
} & {
  [x in KeyCapabilitySection]?: (string | VerificationMethod)[]
}

/**
 * Represents a Service entry in a {@link https://www.w3.org/TR/did-core/#did-document-properties | DID document}.
 *
 * @see {@link https://www.w3.org/TR/did-core/#services}
 * @see {@link https://www.w3.org/TR/did-core/#service-properties}
 */
export interface Service {
  id: string
  type: string
  serviceEndpoint: ServiceEndpoint | ServiceEndpoint[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

/**
 * Represents an endpoint of a Service entry in a DID document.
 *
 * @see {@link https://www.w3.org/TR/did-core/#dfn-serviceendpoint}
 * @see {@link https://www.w3.org/TR/did-core/#services}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceEndpoint = string | Record<string, any>

/**
 * Encapsulates a JSON web key type that includes only the public properties that
 * can be used in DID documents.
 *
 * The private properties are intentionally omitted to discourage the use
 * (and accidental disclosure) of private keys in DID documents.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc7517 | RFC7517 JsonWebKey (JWK)}
 */
export interface JsonWebKey extends Extensible {
  alg?: string
  crv?: string
  e?: string
  ext?: boolean
  key_ops?: string[]
  kid?: string
  kty: string
  n?: string
  use?: string
  x?: string
  y?: string
}

/**
 * Represents the properties of a Verification Method listed in a DID document.
 *
 * This data type includes public key representations that are no longer present in the spec but are still used by
 * several DID methods / resolvers and kept for backward compatibility.
 *
 * @see {@link https://www.w3.org/TR/did-core/#verification-methods}
 * @see {@link https://www.w3.org/TR/did-core/#verification-method-properties}
 */
export interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyBase58?: string
  publicKeyBase64?: string
  publicKeyJwk?: JsonWebKey
  publicKeyHex?: string
  publicKeyMultibase?: string
  blockchainAccountId?: string
  ethereumAddress?: string

  // ConditionalProof2022 subtypes
  conditionOr?: VerificationMethod[]
  conditionAnd?: VerificationMethod[]
  threshold?: number
  conditionThreshold?: VerificationMethod[]
  conditionWeightedThreshold?: ConditionWeightedThreshold[]
  conditionDelegated?: string
  relationshipParent?: string[]
  relationshipChild?: string[]
  relationshipSibling?: string[]
}

export interface ConditionWeightedThreshold {
  condition: VerificationMethod
  weight: number
}

/**
 * URI params resulting from parsing a DID URI
 */
export interface Params {
  [index: string]: string
}

/**
 * An object containing the results of parsing a DID URI string.
 *
 * This is forwarded to implementations of particular DID resolvers when calling the `resolve` method.
 *
 * @see {@link Resolver}
 * @see {@link Resolvable.resolve}
 */
export interface ParsedDID {
  did: string
  didUrl: string
  method: string
  id: string
  path?: string
  fragment?: string
  query?: string
  params?: Params
}

/**
 * The DID resolution function that DID Resolver implementations must implement.
 */
export type DIDResolver = (
  did: string,
  parsed: ParsedDID,
  resolver: Resolvable,
  options: DIDResolutionOptions
) => Promise<DIDResolutionResult>
export type WrappedResolver = () => Promise<DIDResolutionResult>
export type DIDCache = (parsed: ParsedDID, resolve: WrappedResolver) => Promise<DIDResolutionResult>
export type LegacyDIDResolver = (did: string, parsed: ParsedDID, resolver: Resolvable) => Promise<DIDDocument>

export type ResolverRegistry = Record<string, DIDResolver>

export interface LegacyResolverRegistry {
  [index: string]: LegacyDIDResolver
}

export interface ResolverOptions {
  cache?: DIDCache | boolean | undefined
  legacyResolvers?: LegacyResolverRegistry
}

export function inMemoryCache(): DIDCache {
  const cache: Map<string, DIDResolutionResult> = new Map()
  return async (parsed: ParsedDID, resolve) => {
    if (parsed.params && parsed.params['no-cache'] === 'true') return await resolve()

    const cached = cache.get(parsed.didUrl)
    if (cached !== undefined) return cached
    const result = await resolve()
    if (result.didResolutionMetadata?.error !== 'notFound') {
      cache.set(parsed.didUrl, result)
    }
    return result
  }
}

export function noCache(parsed: ParsedDID, resolve: WrappedResolver): Promise<DIDResolutionResult> {
  return resolve()
}

const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
const METHOD = '([a-z0-9]+)'
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
const PARAM_CHAR = '[a-zA-Z0-9_.:%-]'
const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`
const PARAMS = `((${PARAM})*)`
const PATH = `(/[^#?]*)?`
const QUERY = `([?][^#]*)?`
const FRAGMENT = `(#.*)?`
const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`)

/**
 * Parses a DID URL and builds a {@link ParsedDID | ParsedDID object}
 *
 * @param didUrl - the DID URL string to be parsed
 * @returns a ParsedDID object, or null if the input is not a DID URL
 */
export function parse(didUrl: string): ParsedDID | null {
  if (didUrl === '' || !didUrl) return null
  const sections = didUrl.match(DID_MATCHER)
  if (sections) {
    const parts: ParsedDID = {
      did: `did:${sections[1]}:${sections[2]}`,
      method: sections[1],
      id: sections[2],
      didUrl,
    }
    if (sections[4]) {
      const params = sections[4].slice(1).split(';')
      parts.params = {}
      for (const p of params) {
        const kv = p.split('=')
        parts.params[kv[0]] = kv[1]
      }
    }
    if (sections[6]) parts.path = sections[6]
    if (sections[7]) parts.query = sections[7].slice(1)
    if (sections[8]) parts.fragment = sections[8].slice(1)
    return parts
  }
  return null
}

const EMPTY_RESULT: DIDResolutionResult = {
  didResolutionMetadata: {},
  didDocument: null,
  didDocumentMetadata: {},
}

export function wrapLegacyResolver(resolve: LegacyDIDResolver): DIDResolver {
  return async (did, parsed, resolver) => {
    try {
      const doc = await resolve(did, parsed, resolver)
      return {
        ...EMPTY_RESULT,
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: doc,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return {
        ...EMPTY_RESULT,
        didResolutionMetadata: {
          error: 'notFound',
          message: e.toString(), // This is not in spec, but may be helpful
        },
      }
    }
  }
}

/**
 * The method signature implemented by this resolver.
 */
export interface Resolvable {
  resolve: (didUrl: string, options?: DIDResolutionOptions) => Promise<DIDResolutionResult>
}

/**
 * This implementation of {@link Resolvable} bundles together multiple implementations of {@link DIDResolver} and
 * presents a single function call to users.
 */
export class Resolver implements Resolvable {
  private readonly registry: ResolverRegistry
  private readonly cache: DIDCache

  constructor(registry: ResolverRegistry = {}, options: ResolverOptions = {}) {
    this.registry = registry
    this.cache = options.cache === true ? inMemoryCache() : options.cache || noCache
    if (options.legacyResolvers) {
      Object.keys(options.legacyResolvers).map((methodName) => {
        if (!this.registry[methodName]) {
          this.registry[methodName] = wrapLegacyResolver(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            options.legacyResolvers![methodName]
          )
        }
      })
    }
  }

  async resolve(didUrl: string, options: DIDResolutionOptions = {}): Promise<DIDResolutionResult> {
    const parsed = parse(didUrl)
    if (parsed === null) {
      return {
        ...EMPTY_RESULT,
        didResolutionMetadata: { error: 'invalidDid' },
      }
    }
    const resolver = this.registry[parsed.method]
    if (!resolver) {
      return {
        ...EMPTY_RESULT,
        didResolutionMetadata: { error: 'unsupportedDidMethod' },
      }
    }
    return this.cache(parsed, () => resolver(parsed.did, parsed, this, options))
  }
}
