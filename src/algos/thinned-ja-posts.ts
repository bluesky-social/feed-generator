import type { DatetimeString } from "@atproto/lex"
import { app } from '../lexicons/index.js'
import { type AppContext } from '../util/config.js'

export const shortname = 'thinned-ja-posts'

export const handler = async (ctx: AppContext, params: app.bsky.feed.getFeedSkeleton.$Params) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit * 100)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString() as DatetimeString
    builder = builder.where('post.indexedAt', '<', timeStr)
  }
  const res = await builder.execute()

  const feed = res
    .filter(row => (row.uri.split('').map(v => v.codePointAt(0)).reduce((sum=0, v=0) => sum+v, 0) ?? 0) % 100 === 0)
    .map((row) => ({
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
