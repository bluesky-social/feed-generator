import { InvalidRequestError } from '@atproto/xrpc-server'
import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'

export const shortname = 'vn-politics'

type FeedCursor = {
  tier: 0 | 1
  createdAt: string
  uri: string
}

const decodeCursor = (value?: string): FeedCursor | undefined => {
  if (!value) return undefined

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (
      (parsed.tier === 0 || parsed.tier === 1) &&
      typeof parsed.createdAt === 'string' &&
      typeof parsed.uri === 'string'
    ) {
      return parsed as FeedCursor
    }
  } catch {
    // Invalid cursors are rejected below.
  }

  throw new InvalidRequestError('Invalid feed cursor')
}

const encodeCursor = (cursor: FeedCursor) =>
  Buffer.from(JSON.stringify(cursor)).toString('base64url')

const getAppUserPosts = async (
  ctx: AppContext,
  limit: number,
  cursor?: FeedCursor,
) => {
  let query = ctx.db
    .selectFrom('post')
    .innerJoin('app_user', 'app_user.did', 'post.authorDid')
    .select(['post.uri', 'post.createdAt'])
    .where('post.status', '=', 'active')
    .orderBy('post.createdAt', 'desc')
    .orderBy('post.uri', 'desc')

  if (cursor?.tier === 0) {
    query = query.where((expression) =>
      expression.or([
        expression('post.createdAt', '<', cursor.createdAt),
        expression.and([
          expression('post.createdAt', '=', cursor.createdAt),
          expression('post.uri', '<', cursor.uri),
        ]),
      ]),
    )
  }

  return query.limit(limit).execute()
}

const getOtherPoliticalPosts = async (
  ctx: AppContext,
  limit: number,
  cursor?: FeedCursor,
) => {
  let query = ctx.db
    .selectFrom('post')
    .leftJoin('app_user', 'app_user.did', 'post.authorDid')
    .select(['post.uri', 'post.createdAt'])
    .where('post.status', '=', 'active')
    .where('post.isPolitical', '=', 1)
    .where('app_user.did', 'is', null)
    .orderBy('post.createdAt', 'desc')
    .orderBy('post.uri', 'desc')

  if (cursor?.tier === 1) {
    query = query.where((expression) =>
      expression.or([
        expression('post.createdAt', '<', cursor.createdAt),
        expression.and([
          expression('post.createdAt', '=', cursor.createdAt),
          expression('post.uri', '<', cursor.uri),
        ]),
      ]),
    )
  }

  return query.limit(limit).execute()
}

export const handler = async (
  ctx: AppContext,
  params: QueryParams,
): Promise<AlgoOutput> => {
  const cursor = decodeCursor(params.cursor)
  const limit = Math.max(1, Math.min(params.limit, 100))
  const posts: Array<{ uri: string; createdAt: string; tier: 0 | 1 }> = []

  if (!cursor || cursor.tier === 0) {
    const appPosts = await getAppUserPosts(ctx, limit, cursor)
    posts.push(...appPosts.map((post) => ({ ...post, tier: 0 as const })))
  }

  if (posts.length < limit) {
    const politicalCursor = cursor?.tier === 1 ? cursor : undefined
    const politicalPosts = await getOtherPoliticalPosts(
      ctx,
      limit - posts.length,
      politicalCursor,
    )
    posts.push(...politicalPosts.map((post) => ({ ...post, tier: 1 as const })))
  }

  const lastPost = posts.at(-1)
  return {
    feed: posts.map((post) => ({ post: post.uri })),
    cursor: lastPost
      ? encodeCursor({
          tier: lastPost.tier,
          createdAt: lastPost.createdAt,
          uri: lastPost.uri,
        })
      : undefined,
  }
}