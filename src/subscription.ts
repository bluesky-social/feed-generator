import { ids, lexicons } from './lexicon/lexicons'
import { Record as PostRecord } from './lexicon/types/app/bsky/feed/post'
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import {
  FirehoseSubscriptionBase,
  getPostOperations,
} from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const postOps = await getPostOperations(evt)
    const postsToDelete = postOps.deletes.map((del) => del.uri)
    const postsToCreate = postOps.creates
      .filter((create) => {
        // only alf-related posts
        return (
          isPost(create.record) &&
          create.record.text.toLowerCase().includes('alf')
        )
      })
      .map((create) => {
        // map alf-related posts to a db row
        const record = isPost(create.record) ? create.record : null
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: record?.reply?.parent.uri ?? null,
          replyRoot: record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}

export const isPost = (obj: unknown): obj is PostRecord => {
  try {
    lexicons.assertValidRecord(ids.AppBskyFeedPost, obj)
    return true
  } catch (err) {
    return false
  }
}
