import http from 'http'
import events from 'events'
import express from 'express'
import helmet from 'helmet'
import { AppBskyGraphGetFollows, Agent } from '@atproto/api'
import { DidResolver, MemoryCache } from '@atproto/identity'
import { createServer } from './lexicon/index.js'
import feedGeneration from './methods/feed-generation.js'
import describeGenerator from './methods/describe-generator.js'
import { createDb, Database, migrateToLatest } from './db/index.js'
import { FirehoseSubscription } from './subscription.js'
import { AppContext, Config } from './config.js'
import wellKnown from './well-known.js'

export class FeedGenerator {
  public app: express.Application
  public server?: http.Server
  public db: Database
  public firehose: FirehoseSubscription
  public cfg: Config

  constructor(
    app: express.Application,
    db: Database,
    firehose: FirehoseSubscription,
    cfg: Config,
  ) {
    this.app = app
    this.db = db
    this.firehose = firehose
    this.cfg = cfg
  }

  static create(cfg: Config) {
    const app = express()
    app.use(helmet())
    const db = createDb(cfg.sqliteLocation)
    const firehose = new FirehoseSubscription(
      db,
      cfg.subscriptionEndpoint,
      cfg.publisherDid,
    )

    const didCache = new MemoryCache()
    const didResolver = new DidResolver({
      plcUrl: 'https://plc.directory',
      didCache,
    })

    const server = createServer({
      validateResponse: true,
      payload: {
        jsonLimit: 100 * 1024, // 100kb
        textLimit: 100 * 1024, // 100kb
        blobLimit: 5 * 1024 * 1024, // 5mb
      },
    })
    const ctx: AppContext = {
      db,
      didResolver,
      cfg,
    }
    feedGeneration(server, ctx)
    describeGenerator(server, ctx)
    app.use(server.xrpc.router)
    app.use(wellKnown(ctx))

    return new FeedGenerator(app, db, firehose, cfg)
  }

  async start(): Promise<http.Server> {
    await migrateToLatest(this.db)
    await this.seedFollows()
    this.firehose.run(this.cfg.subscriptionReconnectDelay)
    this.startCleanup()
    this.startFollowRefresh()
    this.server = this.app.listen(this.cfg.port, this.cfg.listenhost)
    await events.once(this.server, 'listening')
    return this.server
  }

  private async seedFollows() {
    const agent = new Agent('https://bsky.social')
    const dids: string[] = [this.cfg.publisherDid]

    let cursor: string | undefined
    do {
      const res: { data: AppBskyGraphGetFollows.OutputSchema } =
        await agent.app.bsky.graph.getFollows({
          actor: this.cfg.publisherDid,
          limit: 100,
          cursor,
        })
      for (const follow of res.data.follows) dids.push(follow.did)
      cursor = res.data.cursor
    } while (cursor)

    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('following').execute()
      await trx
        .insertInto('following')
        .values(dids.map((did) => ({ did })))
        .onConflict((oc) => oc.doNothing())
        .execute()
    })

    await this.firehose.loadFollowing()
    console.log(`following ${dids.length - 1} accounts`)
  }

  private startFollowRefresh() {
    setInterval(async () => {
      try {
        await this.seedFollows()
      } catch (err) {
        console.error('follow refresh failed', err)
      }
    }, 15 * 60 * 1000)
  }

  private startCleanup() {
    const prune = async () => {
      const oneWeekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString()
      await this.db
        .deleteFrom('like')
        .where(
          'subjectUri',
          'in',
          this.db
            .selectFrom('post')
            .select('uri')
            .where('indexedAt', '<=', oneWeekAgo),
        )
        .execute()
      const { numDeletedRows } = await this.db
        .deleteFrom('post')
        .where('indexedAt', '<=', oneWeekAgo)
        .executeTakeFirstOrThrow()
      if (numDeletedRows > 0n) {
        console.log(`pruned ${numDeletedRows} posts older than one week`)
      }
    }

    prune()
    setInterval(prune, 24 * 60 * 60 * 1000)
  }
}

export default FeedGenerator
