import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

const matchText: string[] = [
]

 const matchPatterns: RegExp[] = [
  /(^|\s)old school(\s|$)/im,
  /(^|\s)cairnrpg(\s|$)/im,
  /(^|\s)bx(\s|$)/im,
  /(^|\s)whitebox(\s|$)/im,
  /(^|\s)odnd(\s|$)/im,
  /(^|\s)adnd(\s|$)/im,
  /(^|\s)bfrpg(\s|$)/im,
  /(^|\s)old school roleplaying(\s|$)/im,
  /(^|\s)old school rpg(\s|$)/im,
  /(^|\s)old school essentials(\s|$)/im,
  /(^|\s)mausritter(\s|$)/im,
  /(^|\s)osric(\s|$)/im,
  /(^|\s)ose(\s|$)/im,
  /(^|\s)osr(\s|$)/im,
  /(^|\s)nsr(\s|$)/im,
  /(^|\s)dcc(\s|$)/im,
]

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
