import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

const matchText: string[] = [
  'flamengo',
  'mengão',
  'mengo',
  'crf',
  'clube de regatas do flamengo',
  'gabigol',
  'zico',
]

const matchPatterns: RegExp[] = [
  /(^|[\s\W])flamengo($|[\W\s])/im,
  /(^|[\s\W])crf($|[\W\s])/im,
]

// Include high profile users here to always include their posts
const matchUsers: string[] = [
  //
]

// Exclude posts from these users
const bannedUsers: string[] = [
  //
]
export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    //for (const post of ops.posts.creates) {
    //  console.log(post.record.text)
    //}

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        const txt = create.record.text.toLowerCase()
        return (
          (matchText.some((term) => txt.includes(term)) ||
            matchPatterns.some((pattern) => pattern.test(txt)) ||
            matchUsers.includes(create.author)) &&
          !bannedUsers.includes(create.author)
        )
      })
      .map((create) => {
        console.log(`Found post by ${create.author}: ${create.record.text}`)

        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
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
