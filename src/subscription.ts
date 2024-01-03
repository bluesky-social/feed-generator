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
    // for (const post of ops.posts.creates) {
    //   console.log(post.record.text)
    // }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only alf-related posts
        const _text = create.record.text.toLowerCase();
        return _text.includes('猛禽') || 
          _text.includes('フクロウ') ||
          _text.includes('ふくろう') ||
          _text.includes('オオタカ') ||
          _text.includes('オオワシ') ||
          _text.includes('トンビ') ||
          _text.includes('オジロワシ') ||
          _text.includes('チョウゲンボウ') ||
          _text.includes('チュウヒ') ||
          _text.includes('イヌワシ') ||
          _text.includes('ノスリ') ||
         _text.includes('ハヤブサ') ||
          _text.includes('ハクトウワシ')||
          _text.includes('ミミズク') ||
          _text.includes('みみずく');
      })
      .map((create) => {
        // map alf-related posts to a db row
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
