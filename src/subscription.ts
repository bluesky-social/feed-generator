import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    for (const post of ops.posts.creates) {
      console.log(post.record.text)
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
        
    const postsToCreate = ops.posts.creates
        .filter((create) => {
          if (!create.record.langs?.includes('fr') && !create.record.langs?.includes('en'))
            return false;
  
          const normalText = [
            "vtubing",
            "vtubbing",
            "vtuber",
            "vtubeur",
            "vtb",
            "vtuberfr",
            "vtbfr",
            "vtubeurfr",
            "vtubeur français",
            "vtuber français",
            "vtuber française"
          ];
          
          const keywords = [
            /\bvtuberfr\b/,
            /\bfrvtubers\b/,
            /\bvtuberqc\b/,
            /\bqcvtuber\b/,
            /\bvtubeurfr\b/,
            /\bvtubersfr\b/,
            /\bfrvtuber\b/,
          ]
  
          const excludedKeywords = [
            "ririmiaou",
          ]
          
  
          return ((keywords.some((key) => key.test(create.record.text))
    ||	normalText.some((key) => create.record.text.toLowerCase().includes(key))
    )
      && !excludedKeywords.some((key) => create.record.text.toLowerCase().includes(key))
    )
        })
        .map((create) => {
          // map alf-related posts to a db row
          return {
            uri: create.uri,
            cid: create.cid,
            indexedAt: new Date().toISOString(),
          }
        });

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
