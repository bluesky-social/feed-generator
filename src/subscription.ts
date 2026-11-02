import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { isPoliticalPost } from './util/political'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  constructor(
    db: ConstructorParameters<typeof FirehoseSubscriptionBase>[0],
    service: string,
    private readonly appUserDids: Set<string>,
  ) {
    super(db, service)
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToUpsert = ops.posts.creates
      .filter(
        (post) =>
          this.appUserDids.has(post.author) || isPoliticalPost(post.record.text),
      )
      .map((post) => ({
        uri: post.uri,
        cid: post.cid,
        indexedAt: new Date().toISOString(),
        authorDid: post.author,
        createdAt: post.record.createdAt,
        langsJson: JSON.stringify(post.record.langs ?? []),
        isPolitical: isPoliticalPost(post.record.text) ? 1 : 0,
        status: 'active' as const,
      }))

    if (postsToDelete.length > 0) {
      await this.db
        .updateTable('post')
        .set({ status: 'deleted' })
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToUpsert.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToUpsert)
        .onConflict((conflict) =>
          conflict.column('uri').doUpdateSet((expression) => ({
            cid: expression.ref('excluded.cid'),
            indexedAt: expression.ref('excluded.indexedAt'),
            authorDid: expression.ref('excluded.authorDid'),
            createdAt: expression.ref('excluded.createdAt'),
            langsJson: expression.ref('excluded.langsJson'),
            isPolitical: expression.ref('excluded.isPolitical'),
            status: expression.ref('excluded.status'),
          })),
        )
        .execute()
    }
  }
}
