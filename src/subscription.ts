import { Subscription } from '@atproto/xrpc-server'
import { cborToLexRecord, readCar } from '@atproto/repo'
import { ids, lexicons } from './lexicon/lexicons'
import { Record as PostRecord } from './lexicon/types/app/bsky/feed/post'

import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { Database, PostTable } from './db'

const METHOD = ids.ComAtprotoSyncSubscribeRepos

export class FirehoseSubscription {
  public sub: Subscription

  constructor(public db: Database, public service: string) {
    this.sub = new Subscription({
      service: service,
      method: METHOD,
      // signal: signal,
      getParams: () => this.getState(),
      validate: (value) => {
        try {
          return lexicons.assertValidXrpcMessage<RepoEvent>(METHOD, value)
        } catch (err) {
          console.error('repo subscription skipped invalid message', err)
        }
      },
    })
  }

  async run() {
    for await (const evt of this.sub) {
      const postEvts = await getPostEventsFromEvt(evt)
      const toDelete: string[] = []
      const toCreate: PostTable[] = []
      for (const evt of postEvts) {
        if (evt.type === 'delete') {
          toDelete.push(evt.uri)
        } else {
          // only alf related posts
          if (evt.text.includes('alf') || evt.text.includes('Alf')) {
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

  async getState(): Promise<{ cursor: number }> {
    const res = await this.db
      .selectFrom('sub_state')
      .selectAll()
      .where('service', '=', this.service)
      .executeTakeFirst()
    return res ? { cursor: res.cursor } : { cursor: 0 }
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

const getPostEventsFromEvt = async (evt: unknown): Promise<PostEvent[]> => {
  if (!isCommit(evt)) return []
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
