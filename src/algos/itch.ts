import { InvalidRequestError } from '@atproto/xrpc-server'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

export const shortname = 'itch-io'

const itchRegex = /\S*\.itch\.io\/?.*/

const matcher = (post) => {
  return itchRegex.test(post.record.text.toLowerCase())
}

export const filterAndMap = (posts) =>
  posts.filter(matcher).map((create) => {
    return {
      uri: create.uri,
      cid: create.cid,
      replyParent: create.record?.reply?.parent.uri ?? null,
      replyRoot: create.record?.reply?.root.uri ?? null,
      indexedAt: new Date().toISOString(),
    }
  })

const pinnedMessage = ''

export const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db
    .selectFrom('post')
    .innerJoin('post_tag', 'post_tag.post_uri', 'post.uri')
    .where('post_tag.tag', '=', shortname)
    .selectAll('post')
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const [indexedAt, cid] = params.cursor.split('::')
    if (!indexedAt || !cid) {
      throw new InvalidRequestError('malformed cursor')
    }
    const timeStr = new Date(parseInt(indexedAt, 10)).toISOString()
    builder = builder
      .where((eb) =>
        eb.or([
          eb('post.indexedAt', '<', timeStr),
          eb('post.indexedAt', '=', timeStr),
        ]),
      )
      .where('post.cid', '<', cid)
  }
  const res = await builder.execute()

  const feed = res.map((row) => ({
    post: row.uri,
  }))

  if (pinnedMessage) {
    feed.unshift({ post: pinnedMessage })
  }

  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
  }

  return {
    cursor,
    feed,
  }
}
