import type { DatetimeString } from "@atproto/lex"
import { app } from '../lexicons/index.js'
import { type AppContext } from '../util/config.js'

export const shortname = 'ja-videos'

export const handler = async (ctx: AppContext, params: app.bsky.feed.getFeedSkeleton.$Params) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .where('isVideo', '=', 'true')
    .limit(params.limit)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString() as DatetimeString
    builder = builder.where('post.indexedAt', '<', timeStr)
  }
  const res = await builder.execute()

  const feed = res.map((row) => ({
    post: row.uri,
  }))

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
