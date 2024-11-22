import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

// max 15 chars
export const shortname = 'beyhive'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  const pinned = await ctx.db
    .selectFrom('post')
    .selectAll()
    .where('pinned', '=', true)
    .limit(1)
    .executeTakeFirst()

  console.log(pinned)

  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('post.indexedAt', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
    builder = builder.where('post.indexedAt', '<', timeStr)
  }
  const res = await builder.execute()

  let feed = res.map((row) => ({
    post: row.uri,
  }))

  if (pinned) {
    feed.push({
      post: pinned.uri,
    })
  }

  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString(10)
  }

  return {
    cursor,
    feed,
  }
}
