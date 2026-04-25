import { sql } from 'kysely'
import { AtUri } from '@atproto/syntax'
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos.js'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription.js'

const MEDIA_EMBED_TYPES = new Set([
  'app.bsky.embed.images',
  'app.bsky.embed.images#main',
  'app.bsky.embed.video',
  'app.bsky.embed.video#main',
  'app.bsky.embed.recordWithMedia',
  'app.bsky.embed.recordWithMedia#main',
])

function hasMediaEmbed(record: { embed?: unknown }): boolean {
  if (!record.embed) return false
  const embed = record.embed as { $type?: string }
  return typeof embed.$type === 'string' && MEDIA_EMBED_TYPES.has(embed.$type)
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  private followingSet: Set<string>

  constructor(
    db: ConstructorParameters<typeof FirehoseSubscriptionBase>[0],
    service: string,
    private readonly publisherDid: string,
  ) {
    super(db, service)
    this.followingSet = new Set([publisherDid])
  }

  async loadFollowing() {
    const rows = await this.db.selectFrom('following').select('did').execute()
    this.followingSet = new Set(rows.map((r) => r.did))
    this.followingSet.add(this.publisherDid)
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // Track follows from the publisher so new follows take effect immediately
    const newFollowDids = ops.follows.creates
      .filter((c) => c.author === this.publisherDid)
      .map((c) => c.record.subject)

    if (newFollowDids.length > 0) {
      await this.db
        .insertInto('following')
        .values(newFollowDids.map((did) => ({ did })))
        .onConflict((oc) => oc.doNothing())
        .execute()
      for (const did of newFollowDids) this.followingSet.add(did)
    }

    // Index media posts from followed accounts
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter(
        (create) =>
          this.followingSet.has(create.author) &&
          hasMediaEmbed(create.record),
      )
      .map((create) => ({
        uri: create.uri,
        cid: create.cid,
        indexedAt: new Date().toISOString(),
        likeCount: 0,
      }))

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
      await this.db
        .deleteFrom('like')
        .where('subjectUri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }

    // Track likes for indexed posts
    const likesToDelete = ops.likes.deletes.map((del) => del.uri)
    const likesToCreate = ops.likes.creates.flatMap((create) => {
      try {
        new AtUri(create.record.subject.uri)
        return [{ uri: create.uri, subjectUri: create.record.subject.uri }]
      } catch {
        return []
      }
    })

    if (likesToDelete.length > 0) {
      const likeRows = await this.db
        .selectFrom('like')
        .selectAll()
        .where('uri', 'in', likesToDelete)
        .execute()

      if (likeRows.length > 0) {
        const subjectUris = likeRows.map((r) => r.subjectUri)
        for (const subjectUri of subjectUris) {
          await this.db
            .updateTable('post')
            .set({ likeCount: sql`max(likeCount - 1, 0)` })
            .where('uri', '=', subjectUri)
            .execute()
        }
        await this.db
          .deleteFrom('like')
          .where('uri', 'in', likesToDelete)
          .execute()
      }
    }

    if (likesToCreate.length > 0) {
      const subjectUris = likesToCreate.map((l) => l.subjectUri)
      const indexedPosts = await this.db
        .selectFrom('post')
        .select('uri')
        .where('uri', 'in', subjectUris)
        .execute()
      const indexedUriSet = new Set(indexedPosts.map((p) => p.uri))

      const filteredLikes = likesToCreate.filter((l) =>
        indexedUriSet.has(l.subjectUri),
      )

      if (filteredLikes.length > 0) {
        await this.db
          .insertInto('like')
          .values(filteredLikes)
          .onConflict((oc) => oc.doNothing())
          .execute()

        for (const like of filteredLikes) {
          await this.db
            .updateTable('post')
            .set({ likeCount: sql`likeCount + 1` })
            .where('uri', '=', like.subjectUri)
            .execute()
        }
      }
    }
  }
}
