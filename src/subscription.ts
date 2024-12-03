import { create } from 'domain'
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { Database } from './db'
import { algoClasses } from './algos'

export class FirehoseSubscription extends FirehoseSubscriptionBase {

  constructor(public db: Database, public service: string) {
    super(db, service)
    algoClasses.forEach((algo) => {
      algo.initFeed(db)
    })
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => { // User filter
        return create.author.includes("did:plc:wc2nljklaywqr4axivpddo4i") // hardcoded for now
      })
      // .filter((create) => {
      //   return create.record
      // })
      .map((create) => {
        return {
          uri: create.uri,
          cid: create.cid,
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
