import { BskyAgent } from '@atproto/api'
import limit from './rateLimit.js'

export const getListFeed = async (
  list: string,
  agent: BskyAgent,
): Promise<string[]> => {
  let total_retrieved = 1
  let current_cursor: string | undefined = undefined
  let posts: string[] = []

  do {
    const list_feed = await limit(() =>
      agent.app.bsky.feed.getFeed({
        feed: `${list}`,
        limit: 30,
        cursor: current_cursor,
      }),
    )
    total_retrieved = list_feed.data.feed.length
    current_cursor = list_feed.data.cursor
    list_feed.data.feed.forEach((post) => {
      posts.push(post.post.uri)
    })
  } while (current_cursor !== undefined && current_cursor !== '')

  return posts
}

export default getListFeed
