import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    /*for (const post of ops.posts.creates) {
      console.log(post)
    }*/

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only alf-related posts
        const re =
          /^(?!.*(#beyboons|#haghive|haghive|hasbeyn)).*\b(beyonce|beyhive|beyoncé|yonce|yoncé|#beyonce)\b.*$/imu

        let match = false

        let matchString = create.record.text.toLowerCase()

        const normalizedString = removeAccents(matchString)

        if (normalizedString.match(re) !== null) {
          console.log(create.record)
          match = true
        }

        return match
      })
      .map((create) => {
        // map alf-related posts to a db row
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
