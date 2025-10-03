import { type QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { type AppContext } from '../util/config'

// max 15 chars
export const shortname = 'thinned-ja-posts'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit * 100)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
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
