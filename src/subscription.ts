import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // Match posts containing "#survivor" and exclude outlier hashtags
        const text = create.record.text.toLowerCase()

        // Match posts containing "#survivor" followed by optional digits (e.g., #survivor, #survivor7, #survivorcbs)
        const includeHashtagsRegex = /#survivor(\d*|cbs)?/;
        const excludeHashtagsRegex = /#survivorseries|#survivorgameplay|#deadbydaylight|#survivorslike|#rainworld|#survivorlike|#survivorsguilt|#survivorguilt|#csasurvivor|#survivorsempowered|#mentalhealth|#excult/;

        // Only include posts that have #survivor followed by optional numbers or 'cbs', and do not contain excluded hashtags
        return includeHashtagsRegex.test(text) && !excludeHashtagsRegex.test(text)
      })
      .map((create) => {
        // map Survivor-related posts to a db row
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
