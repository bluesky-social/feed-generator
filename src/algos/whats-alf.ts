import { AppBskyFeedGetFeedSkeleton } from '@atproto/api'
import { AppContext } from '../config'

// max 15 chars
export const shortname = 'whats-alf'

export const handler = async (
  ctx: AppContext,
  params: AppBskyFeedGetFeedSkeleton.QueryParams,
) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit || 50)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
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
