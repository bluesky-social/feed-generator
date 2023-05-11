import { Subscription } from '@atproto/xrpc-server'
import { ids, lexicons } from '../lexicon/lexicons'
import {
  Commit,
  OutputSchema as RepoEvent,
  isCommit,
} from '../lexicon/types/com/atproto/sync/subscribeRepos'
import { Database } from '../db'
import { cborToLexRecord, readCar } from '@atproto/repo'

export abstract class FirehoseSubscriptionBase {
  public sub: Subscription<RepoEvent>

  constructor(public db: Database, public service: string) {
    this.sub = new Subscription({
      service: service,
      method: ids.ComAtprotoSyncSubscribeRepos,
      getParams: () => this.getCursor(),
      validate: (value: unknown) => {
        try {
          return lexicons.assertValidXrpcMessage<RepoEvent>(
            ids.ComAtprotoSyncSubscribeRepos,
            value,
          )
        } catch (err) {
          console.error('repo subscription skipped invalid message', err)
        }
      },
    })
  }

  abstract handleEvent(evt: RepoEvent): Promise<void>

  async run() {
    await this.ensureCursor()
    for await (const evt of this.sub) {
      try {
        await this.handleEvent(evt)
      } catch (err) {
        console.error('repo subscription could not handle message', err)
      }
      // update stored cursor every 20 events or so
      if (isCommit(evt) && evt.seq % 20 === 0) {
        await this.updateCursor(evt.seq)
      }
    }
  }

  async ensureCursor() {
    await this.db
      .insertInto('sub_state')
      .values({
        service: this.service,
        cursor: 0,
      })
      .onConflict((oc) => oc.doNothing())
      .execute()
  }

  async updateCursor(cursor: number) {
    await this.db
      .updateTable('sub_state')
      .set({ cursor })
      .where('service', '=', this.service)
      .execute()
  }

  async getCursor(): Promise<{ cursor: number }> {
    const res = await this.db
      .selectFrom('sub_state')
      .selectAll()
      .where('service', '=', this.service)
      .executeTakeFirst()
    return res ? { cursor: res.cursor } : { cursor: 0 }
  }
}

export const getPostOperations = async (evt: Commit): Promise<Operations> => {
  const ops: Operations = { creates: [], deletes: [] }
  const postOps = evt.ops.filter(
    (op) => op.path.split('/')[0] === ids.AppBskyFeedPost,
  )

  if (postOps.length < 1) return ops

  const car = await readCar(evt.blocks)

  for (const op of postOps) {
    // updates not supported yet
    if (op.action === 'update') continue
    const uri = `at://${evt.repo}/${op.path}`
    if (op.action === 'delete') {
      ops.deletes.push({ uri })
    } else if (op.action === 'create') {
      if (!op.cid) continue
      const postBytes = await car.blocks.get(op.cid)
      if (!postBytes) continue
      ops.creates.push({
        uri,
        cid: op.cid.toString(),
        author: evt.repo,
        record: cborToLexRecord(postBytes),
      })
    }
  }

  return ops
}

type CreateOp = {
  uri: string
  cid: string
  author: string
  record: Record<string, unknown>
}

type DeleteOp = {
  uri: string
}

type Operations = {
  creates: CreateOp[]
  deletes: DeleteOp[]
}
