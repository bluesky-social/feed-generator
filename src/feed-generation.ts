import { InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from './lexicon'
import { AppContext } from './config'
import { validateAuth } from './auth'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.getFeedSkeleton(async ({ params, req }) => {
    if (params.feed !== 'did:example:alice/app.bsky.feed.generator/whats-alf') {
      throw new InvalidRequestError(
        'Unsupported algorithm',
        'UnsupportedAlgorithm',
      )
    }
    /**
     * Example of how to check auth if giving user-specific results:
     *
     * const requesterDid = await validateAuth(
     *   req,
     *   ctx.cfg.serviceDid,
     *   ctx.didResolver,
     * )
     */

    let builder = ctx.db
      .selectFrom('post')
      .selectAll()
      .orderBy('indexedAt', 'desc')
      .orderBy('cid', 'desc')

    if (params.cursor) {
      const [indexedAt, cid] = params.cursor.split('..')
      if (!indexedAt || !cid) {
        throw new InvalidRequestError('malformed cursor')
      }
      const timeStr = new Date(parseInt(indexedAt, 10)).toISOString()
      builder = builder
        .where('post.indexedAt', '<', timeStr)
        .orWhere((qb) => qb.where('post.indexedAt', '=', timeStr))
        .where('post.cid', '<', cid)
    }
    const res = await builder.execute()

    const feed = res.map((row) => ({
      post: row.uri,
      replyTo:
        row.replyParent && row.replyRoot
          ? {
              root: row.replyRoot,
              parent: row.replyParent,
            }
          : undefined,
    }))

    let cursor: string | undefined
    const last = res.at(-1)
    if (last) {
      cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
    }

    return {
      encoding: 'application/json',
      body: {
        cursor,
        feed,
      },
    }
  })
}
