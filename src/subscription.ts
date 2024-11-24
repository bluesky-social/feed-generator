import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { uniqBy } from 'lodash'
import {
  filterAndMap as filterAndMapTTRPG,
  shortname as ttrpgShortname,
} from './algos/ttrpg'
import {
  filterAndMap as filterAndMapCritRoleSpoiler,
  shortname as critRoleSpoilerShortname,
} from './algos/critrole-spoilers'
import {
  filterAndMap as filterAndMapTTRPGIntro,
  shortname as ttrpgIntroShortname,
} from './algos/ttrpg-intro'
import {
  filterAndMap as filterAndMapItch,
  shortname as itchShortname,
} from './algos/itch'
// import { filterAndMap as filterAndMapTTRPGTest } from './algos/ttrpg-testing'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const ttrpgCreatePosts = filterAndMapTTRPG(ops.posts.creates)
    const critRoleSpoilerCreatePosts = filterAndMapCritRoleSpoiler(
      ops.posts.creates,
    )
    const ttrpgIntroCreatePosts = filterAndMapTTRPGIntro(ops.posts.creates)
    const itchCreatePosts = filterAndMapItch(ops.posts.creates)

    const ttrpgPostTags = ttrpgCreatePosts.map((post) => ({
      post_uri: post.uri,
      tag: ttrpgShortname,
      indexedAt: post.indexedAt,
    }))
    const critRoleSpoilerPostTags = critRoleSpoilerCreatePosts.map((post) => ({
      post_uri: post.uri,
      tag: critRoleSpoilerShortname,
      indexedAt: post.indexedAt,
    }))
    const ttrpgIntroPostTags = ttrpgIntroCreatePosts.map((post) => ({
      post_uri: post.uri,
      tag: ttrpgIntroShortname,
      indexedAt: post.indexedAt,
    }))
    const itchPostTags = itchCreatePosts.map((post) => ({
      post_uri: post.uri,
      tag: itchShortname,
      indexedAt: post.indexedAt,
    }))
    // const ttrpgTestCreatePosts = filterAndMapTTRPGTest(ops.posts.creates)

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
      await this.db
        .deleteFrom('post_tag')
        .where('post_uri', 'in', postsToDelete)
        .execute()
    }
    const createPosts = uniqBy(
      [
        ...ttrpgCreatePosts,
        ...critRoleSpoilerCreatePosts,
        ...ttrpgIntroCreatePosts,
        ...itchCreatePosts,
      ],
      'uri',
    )
    const createPostTags = [
      ...ttrpgPostTags,
      ...critRoleSpoilerPostTags,
      ...ttrpgIntroPostTags,
      ...itchPostTags,
    ]

    if (createPosts.length > 0) {
      await this.db
        .insertInto('post')
        // .onConflict((oc) => oc.column('uri').doNothing())
        .values(createPosts)
        .execute()
    }
    if (createPostTags.length > 0) {
      await this.db
        .insertInto('post_tag')
        // .onConflict((oc) => oc.column('post_uri').doNothing())
        .values(createPostTags)
        .execute()
    }
  }
}
