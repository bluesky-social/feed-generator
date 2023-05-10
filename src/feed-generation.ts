import { InvalidRequestError } from '@atproto/xrpc-server'
import { Database } from './db'
import { Server } from './lexicon'

export default function (server: Server, db: Database) {
  server.app.bsky.feed.getFeedSkeleton(async ({ params, auth }) => {
    if (params.feed !== 'alf.bsky.social') {
      throw new InvalidRequestError('algorithm unsupported')
    }
    let builder = db
      .selectFrom('posts')
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
        .where('posts.indexedAt', '<', timeStr)
        .orWhere((qb) => qb.where('posts.indexedAt', '=', timeStr))
        .where('posts.cid', '<', cid)
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
