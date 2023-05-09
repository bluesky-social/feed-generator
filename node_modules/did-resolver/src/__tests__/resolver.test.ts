// Copyright 2018 ConsenSys AG

// Licensed under the Apache License, Version 2.0(the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Resolver, parse, DIDResolutionResult } from '../resolver'

describe('resolver', () => {
  describe('parse()', () => {
    it('returns parts', () => {
      expect(parse('did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX')).toEqual({
        method: 'uport',
        id: '2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        did: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        didUrl: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
      })
      expect(parse('did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX/some/path')).toEqual({
        method: 'uport',
        id: '2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        did: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        didUrl: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX/some/path',
        path: '/some/path',
      })
      expect(parse('did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX#fragment=123')).toEqual({
        method: 'uport',
        id: '2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        did: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        didUrl: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX#fragment=123',
        fragment: 'fragment=123',
      })
      expect(parse('did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX/some/path#fragment=123')).toEqual({
        method: 'uport',
        id: '2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        did: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX',
        didUrl: 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX/some/path#fragment=123',
        path: '/some/path',
        fragment: 'fragment=123',
      })
      expect(parse('did:nacl:Md8JiMIwsapml_FtQ2ngnGftNP5UmVCAUuhnLyAsPxI')).toEqual({
        method: 'nacl',
        id: 'Md8JiMIwsapml_FtQ2ngnGftNP5UmVCAUuhnLyAsPxI',
        did: 'did:nacl:Md8JiMIwsapml_FtQ2ngnGftNP5UmVCAUuhnLyAsPxI',
        didUrl: 'did:nacl:Md8JiMIwsapml_FtQ2ngnGftNP5UmVCAUuhnLyAsPxI',
      })
      expect(parse('did:example:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high')).toEqual({
        method: 'example',
        id: '21tDAKCERh95uGgKbJNHYp',
        did: 'did:example:21tDAKCERh95uGgKbJNHYp',
        didUrl: 'did:example:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high',
        params: {
          service: 'agent',
          'foo:bar': 'high',
        },
      })
      expect(parse('did:example:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high?foo=bar')).toEqual({
        method: 'example',
        id: '21tDAKCERh95uGgKbJNHYp',
        didUrl: 'did:example:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high?foo=bar',
        did: 'did:example:21tDAKCERh95uGgKbJNHYp',
        query: 'foo=bar',
        params: {
          service: 'agent',
          'foo:bar': 'high',
        },
      })
      expect(parse('did:example:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high/some/path?foo=bar#key1')).toEqual({
        method: 'example',
        id: '21tDAKCERh95uGgKbJNHYp',
        didUrl: 'did:example:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high/some/path?foo=bar#key1',
        did: 'did:example:21tDAKCERh95uGgKbJNHYp',
        query: 'foo=bar',
        path: '/some/path',
        fragment: 'key1',
        params: {
          service: 'agent',
          'foo:bar': 'high',
        },
      })
      expect(parse('did:web:example.com%3A8443')).toEqual({
        method: 'web',
        id: 'example.com%3A8443',
        didUrl: 'did:web:example.com%3A8443',
        did: 'did:web:example.com%3A8443',
      })
      expect(parse('did:web:example.com:path:some%2Bsubpath')).toEqual({
        method: 'web',
        id: 'example.com:path:some%2Bsubpath',
        didUrl: 'did:web:example.com:path:some%2Bsubpath',
        did: 'did:web:example.com:path:some%2Bsubpath',
      })
      expect(
        parse('did:example:test:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high/some/path?foo=bar#key1')
      ).toEqual({
        method: 'example',
        id: 'test:21tDAKCERh95uGgKbJNHYp',
        didUrl: 'did:example:test:21tDAKCERh95uGgKbJNHYp;service=agent;foo:bar=high/some/path?foo=bar#key1',
        did: 'did:example:test:21tDAKCERh95uGgKbJNHYp',
        query: 'foo=bar',
        path: '/some/path',
        fragment: 'key1',
        params: {
          service: 'agent',
          'foo:bar': 'high',
        },
      })
      expect(parse('did:123:test::test2')).toEqual({
        method: '123',
        id: 'test::test2',
        didUrl: 'did:123:test::test2',
        did: 'did:123:test::test2',
      })
      expect(parse('did:method:%12%AF')).toEqual({
        method: 'method',
        id: '%12%AF',
        didUrl: 'did:method:%12%AF',
        did: 'did:method:%12%AF',
      })
    })

    it('returns null if non compliant', () => {
      expect(parse('')).toEqual(null)
      expect(parse('did:')).toEqual(null)
      expect(parse('did:uport')).toEqual(null)
      expect(parse('did:uport:')).toEqual(null)
      expect(parse('did:uport:1234_12313***')).toEqual(null)
      expect(parse('2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX')).toEqual(null)
      expect(parse('did:method:%12%1')).toEqual(null)
      expect(parse('did:method:%1233%Ay')).toEqual(null)
      expect(parse('did:CAP:id')).toEqual(null)
      expect(parse('did:method:id::anotherid%r9')).toEqual(null)
    })
  })

  describe('resolve', () => {
    let resolver: Resolver
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockmethod: any
    const mockReturn = Promise.resolve({
      didResolutionMetadata: { contentType: 'application/did+json' },
      didDocument: {
        id: 'did:mock:abcdef',
        verificationMethod: [
          {
            id: 'owner',
            controller: '1234',
            type: 'xyz',
          },
        ],
      },
      didDocumentMetadata: {},
    })
    beforeAll(() => {
      mockmethod = jest.fn().mockReturnValue(mockReturn)
      resolver = new Resolver({
        example: async (did: string): Promise<DIDResolutionResult> => ({
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
          didDocument: {
            '@context': 'https://w3id.org/did/v1',
            id: did,
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        }),
        mock: mockmethod,
      })
    })

    it('fails on unhandled methods', async () => {
      await expect(resolver.resolve('did:borg:2nQtiQG6Cgm1GY')).resolves.toEqual({
        didResolutionMetadata: { error: 'unsupportedDidMethod' },
        didDocument: null,
        didDocumentMetadata: {},
      })
    })

    it('fails on parse error', async () => {
      await expect(resolver.resolve('did:borg:')).resolves.toEqual({
        didResolutionMetadata: { error: 'invalidDid' },
        didDocument: null,
        didDocumentMetadata: {},
      })
    })

    it('resolves did document', async () => {
      await expect(resolver.resolve('did:example:123456789')).resolves.toEqual({
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': 'https://w3id.org/did/v1',
          id: 'did:example:123456789',
          verificationMethod: [
            {
              id: 'owner',
              controller: '1234',
              type: 'xyz',
            },
          ],
        },
        didDocumentMetadata: {},
      })
    })

    it('resolves did document with service', async () => {
      const altResolver = new Resolver({
        example: async (did: string): Promise<DIDResolutionResult> => ({
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
          didDocument: {
            '@context': 'https://w3id.org/did/v1',
            id: did,
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
            service: [
              {
                id: `service-${did}`,
                type: 'Service',
                serviceEndpoint: 'https://example.com/',
              },
            ],
          },
          didDocumentMetadata: {},
        }),
        mock: mockmethod,
      })

      await expect(altResolver.resolve('did:example:123456789')).resolves.toEqual({
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': 'https://w3id.org/did/v1',
          id: 'did:example:123456789',
          verificationMethod: [
            {
              id: 'owner',
              controller: '1234',
              type: 'xyz',
            },
          ],
          service: [
            {
              id: 'service-did:example:123456789',
              type: 'Service',
              serviceEndpoint: 'https://example.com/',
            },
          ],
        },
        didDocumentMetadata: {},
      })
    })

    it('resolves did document with expanded service', async () => {
      const altResolver = new Resolver({
        example: async (did: string): Promise<DIDResolutionResult> => ({
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
          didDocument: {
            '@context': 'https://w3id.org/did/v1',
            id: did,
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
            service: [
              {
                id: `service-${did}`,
                type: 'Service',
                serviceEndpoint: {
                  uri: 'yep',
                  accept: ['xyz'],
                },
              },
            ],
          },
          didDocumentMetadata: {},
        }),
        mock: mockmethod,
      })

      await expect(altResolver.resolve('did:example:123456789')).resolves.toEqual({
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': 'https://w3id.org/did/v1',
          id: 'did:example:123456789',
          verificationMethod: [
            {
              id: 'owner',
              controller: '1234',
              type: 'xyz',
            },
          ],
          service: [
            {
              id: 'service-did:example:123456789',
              type: 'Service',
              serviceEndpoint: {
                uri: 'yep',
                accept: ['xyz'],
              },
            },
          ],
        },
        didDocumentMetadata: {},
      })
    })

    it('resolves did document with legacy resolver', async () => {
      const resolverWithLegacy = new Resolver(
        {},
        {
          legacyResolvers: {
            legacy: async (did: string) => ({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              verificationMethod: [
                {
                  id: 'owner',
                  controller: '1234',
                  type: 'xyz',
                },
              ],
            }),
          },
        }
      )

      await expect(resolverWithLegacy.resolve('did:legacy:123456789')).resolves.toEqual({
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument: {
          '@context': 'https://w3id.org/did/v1',
          id: 'did:legacy:123456789',
          verificationMethod: [
            {
              id: 'owner',
              controller: '1234',
              type: 'xyz',
            },
          ],
        },
        didDocumentMetadata: {},
      })
    })

    it('throws on null document', async () => {
      mockmethod = jest.fn().mockReturnValue(
        Promise.resolve({
          didResolutionMetadata: { error: 'notFound' },
          didDocument: null,
          didDocumentMetadata: {},
        })
      )
      const nullRes = new Resolver({
        nuller: mockmethod,
      })

      await expect(nullRes.resolve('did:nuller:asdfghjk')).resolves.toEqual({
        didResolutionMetadata: { error: 'notFound' },
        didDocument: null,
        didDocumentMetadata: {},
      })
    })

    describe('caching', () => {
      describe('default', () => {
        it('should not cache', async () => {
          mockmethod = jest.fn().mockReturnValue(mockReturn)
          resolver = new Resolver({
            mock: mockmethod,
          })

          await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
            didResolutionMetadata: { contentType: 'application/did+json' },
            didDocument: {
              id: 'did:mock:abcdef',
              verificationMethod: [
                {
                  id: 'owner',
                  controller: '1234',
                  type: 'xyz',
                },
              ],
            },
            didDocumentMetadata: {},
          })
          await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
            didResolutionMetadata: { contentType: 'application/did+json' },
            didDocument: {
              id: 'did:mock:abcdef',
              verificationMethod: [
                {
                  id: 'owner',
                  controller: '1234',
                  type: 'xyz',
                },
              ],
            },
            didDocumentMetadata: {},
          })
          return expect(mockmethod).toBeCalledTimes(2)
        })
      })
    })

    describe('cache=true', () => {
      it('should cache', async () => {
        mockmethod = jest.fn().mockReturnValue(mockReturn)
        resolver = new Resolver(
          {
            mock: mockmethod,
          },
          { cache: true }
        )

        await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
          didResolutionMetadata: { contentType: 'application/did+json' },
          didDocument: {
            id: 'did:mock:abcdef',
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        })
        await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
          didResolutionMetadata: { contentType: 'application/did+json' },
          didDocument: {
            id: 'did:mock:abcdef',
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        })
        return expect(mockmethod).toBeCalledTimes(1)
      })

      it('should respect no-cache', async () => {
        mockmethod = jest.fn().mockReturnValue(mockReturn)
        resolver = new Resolver(
          {
            mock: mockmethod,
          },
          { cache: true }
        )

        await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
          didResolutionMetadata: { contentType: 'application/did+json' },
          didDocument: {
            id: 'did:mock:abcdef',
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        })
        await expect(resolver.resolve('did:mock:abcdef;no-cache=true')).resolves.toEqual({
          didResolutionMetadata: { contentType: 'application/did+json' },
          didDocument: {
            id: 'did:mock:abcdef',
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        })
        return expect(mockmethod).toBeCalledTimes(2)
      })

      it('should not cache with different params', async () => {
        mockmethod = jest.fn().mockReturnValue(mockReturn)
        resolver = new Resolver(
          {
            mock: mockmethod,
          },
          { cache: true }
        )

        await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
          didResolutionMetadata: { contentType: 'application/did+json' },
          didDocument: {
            id: 'did:mock:abcdef',
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        })
        await expect(resolver.resolve('did:mock:abcdef?versionId=2')).resolves.toEqual({
          didResolutionMetadata: { contentType: 'application/did+json' },
          didDocument: {
            id: 'did:mock:abcdef',
            verificationMethod: [
              {
                id: 'owner',
                controller: '1234',
                type: 'xyz',
              },
            ],
          },
          didDocumentMetadata: {},
        })
        return expect(mockmethod).toBeCalledTimes(2)
      })

      it('should not cache null docs', async () => {
        mockmethod = jest.fn().mockReturnValue(
          Promise.resolve({
            didResolutionMetadata: { error: 'notFound' },
            didDocument: null,
            didDocumentMetadata: {},
          })
        )
        resolver = new Resolver(
          {
            mock: mockmethod,
          },
          { cache: true }
        )

        await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
          didResolutionMetadata: { error: 'notFound' },
          didDocument: null,
          didDocumentMetadata: {},
        })
        await expect(resolver.resolve('did:mock:abcdef')).resolves.toEqual({
          didResolutionMetadata: { error: 'notFound' },
          didDocument: null,
          didDocumentMetadata: {},
        })
        return expect(mockmethod).toBeCalledTimes(2)
      })
    })
  })
})
