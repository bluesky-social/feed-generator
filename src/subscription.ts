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
    for (const algo in algoClasses) {
      algoClasses[algo].initFeed(db)
    }
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const opp = await Promise.all(ops.posts.creates.map(async (create) => {
      var anyMatch = false
      for (const alg in algoClasses) {
        anyMatch = await algoClasses[alg].applyFeedFilter({
          post: create.record.text,
          authorInclude: create.author
        })
        if (anyMatch == true) {
          break
        }
      }
      
      return {
        uri: create.uri,
        cid: create.cid,
        indexedAt: new Date().toISOString(),
        match: anyMatch,
      }
    }))
    const postsToCreate = opp
      .filter((create) => {
        return create.match == true
      })
      .map((create) => {
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: create.indexedAt,
        }
      })
    if (postsToCreate.length > 0) {
      postsToCreate.forEach((post) => {console.log(post)})
    }
      
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
