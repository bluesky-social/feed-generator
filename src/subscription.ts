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
        const postDate = new Date(create.record.createdAt)
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        if (postDate < twoWeeksAgo) {
          return false
        }

        const textMatch = create.record.text
          .toLowerCase()
          .includes('fragen.navy')

        let imageAltMatch = false
        if (
          create.record.embed &&
          (create.record.embed.$type === 'app.bsky.embed.images#main' ||
            create.record.embed.$type === 'app.bsky.embed.images') &&
          'images' in create.record.embed &&
          Array.isArray((create.record.embed as any).images)
        ) {
          for (const image of (create.record.embed as any).images) {
            if (
              image &&
              typeof image.alt === 'string' &&
              image.alt.toLowerCase().includes('navyfragen')
            ) {
              imageAltMatch = true
              break
            }
          }
        }

        const match = textMatch || imageAltMatch
        if (match) {
          console.log(`Found matching post: ${create.uri}`)
        }
        return match
      })
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
