import { cborToLexRecord, readCar } from '@atproto/repo'
import { ids, lexicons } from './lexicon/lexicons'
import { Record as PostRecord } from './lexicon/types/app/bsky/feed/post'
import {
  Commit,
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { PostTable } from './db'
import { FirehoseSubscriptionBase } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const postEvts = await getPostEventsFromEvt(evt)
    const toDelete: string[] = []
    const toCreate: PostTable[] = []
    for (const evt of postEvts) {
      if (evt.type === 'delete') {
        toDelete.push(evt.uri)
      } else {
        // only alf related posts
        if (evt.text.toLowerCase().includes('alf')) {
          toCreate.push({
            uri: evt.uri,
            cid: evt.cid,
            replyParent: evt.replyParent ?? null,
            replyRoot: evt.replyRoot ?? null,
            indexedAt: new Date().toISOString(),
          })
        }
      }
    }
    if (toDelete.length > 0) {
      await this.db.deleteFrom('posts').where('uri', 'in', toDelete).execute()
    }
    if (toCreate.length > 0) {
      await this.db
        .insertInto('posts')
        .values(toCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}

type PostEvent = CreatePost | DeletePost

type CreatePost = {
  type: 'create'
  uri: string
  cid: string
  author: string
  text: string
  replyRoot?: string
  replyParent?: string
}

type DeletePost = {
  type: 'delete'
  uri: string
}

const getPostEventsFromEvt = async (evt: Commit): Promise<PostEvent[]> => {
  const postOps = evt.ops.filter(
    (op) => op.path.split('/')[1] === 'app.bsky.feed.post',
  )
  if (postOps.length < 1) return []

  const car = await readCar(evt.blocks)

  const postEvts: PostEvent[] = []
  for (const op of postOps) {
    // updates not supported yet
    if (op.action === 'update') continue
    const uri = `at://${evt.repo}/${op.path}`
    if (op.action === 'delete') {
      postEvts.push({ type: 'delete', uri })
    } else if (op.action === 'create') {
      if (!op.cid) continue
      const postBytes = await car.blocks.get(op.cid)
      if (!postBytes) continue

      const record = cborToLexRecord(postBytes)
      if (!isPost(record)) continue
      await lexicons.assertValidRecord(ids.AppBskyFeedPost, record)
      postEvts.push({
        type: 'create',
        uri,
        cid: op.cid.toString(),
        author: evt.repo,
        text: record.text,
        replyRoot: record.reply?.root.uri,
        replyParent: record.reply?.parent.uri,
      })
    }
  }
  return postEvts
}

export const isPost = (obj: unknown): obj is PostRecord => {
  try {
    lexicons.assertValidRecord(ids.AppBskyFeedPost, obj)
    return true
  } catch (err) {
    return false
  }
}
