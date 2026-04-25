import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton.js'
import { AppContext } from '../config.js'

export const shortname = 'media-feed'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const handler = async (ctx: AppContext, params: QueryParams) => {
  const oneWeekAgo = new Date(Date.now() - ONE_WEEK_MS).toISOString()

  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .where('likeCount', '<', 300)
    .where('indexedAt', '>', oneWeekAgo)
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
    builder = builder.where('post.indexedAt', '<', timeStr)
  }

  const res = await builder.execute()

  const feed = res.map((row) => ({ post: row.uri }))

  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString(10)
  }

  return { cursor, feed }
}
