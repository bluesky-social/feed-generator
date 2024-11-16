import http from 'http'
import events from 'events'
import express from 'express'
import { DidResolver, MemoryCache } from '@atproto/identity'
import { createServer } from './lexicon/index.js'
import feedGeneration from './methods/feed-generation.js'
import describeGenerator from './methods/describe-generator.js'
import { createDb, Database, migrateToLatest } from './db/index.js'
import { FirehoseSubscription } from './subscription.js'
import WebSocket from 'ws'
import { Jetstream } from '@skyware/jetstream'
import { AppContext, Config } from './config.js'
import wellKnown from './well-known.js'

export class FeedGenerator {
  public app: express.Application
  public server?: http.Server
  public db: Database
  public firehose: FirehoseSubscription
  public cfg: Config
  public jetstream: Jetstream

  constructor(
    app: express.Application,
    db: Database,
    firehose: FirehoseSubscription,
    cfg: Config,
    jetstream: Jetstream,
  ) {
    this.app = app
    this.db = db
    this.firehose = firehose
    this.cfg = cfg
    this.jetstream = jetstream
  }

  static create(cfg: Config) {
    const app = express()
    const db = createDb(cfg.dbLocation, cfg.dbCert)
    const firehose = new FirehoseSubscription(db, cfg.subscriptionEndpoint)

    const jetstream = new Jetstream({
      ws: WebSocket,
      wantedCollections: ['app.bsky.feed.post'], // omit to receive all collections
      wantedDids: ['did:plc:dvej7nvbmmusifxfeund54cz'], // omit to receive events from all dids
    })

    jetstream.onCreate('app.bsky.feed.post', (event) => {
      console.log(`New post: ${event}`)
    })

    jetstream.onDelete('app.bsky.feed.post', (event) => {
      console.log(`Deleted post: ${event.commit.rkey}`)
    })

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

    return new FeedGenerator(app, db, firehose, cfg, jetstream)
  }

  async start(): Promise<http.Server> {
    await migrateToLatest(this.db)
    this.jetstream.start()
    //this.firehose.run(this.cfg.subscriptionReconnectDelay)
    this.server = this.app.listen(this.cfg.port, this.cfg.listenhost)
    await events.once(this.server, 'listening')
    return this.server
  }
}

export default FeedGenerator
