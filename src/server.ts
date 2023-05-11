import http from 'http'
import events from 'events'
import express from 'express'
import { createServer } from './lexicon'
import feedGeneration from './feed-generation'
import { createDb, Database } from './db'
import { FirehoseSubscription } from './subscription'

export type Config = {
  port: number
  sqliteLocation: string
  subscriptionEndpoint: string
}

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

  static create(config?: Partial<Config>) {
    const cfg = {
      port: config?.port ?? 3000,
      sqliteLocation: config?.sqliteLocation ?? 'test.sqlite',
      subscriptionEndpoint: config?.subscriptionEndpoint ?? 'wss://bsky.social',
    }
    const app = express()
    const db = createDb(cfg.sqliteLocation)
    const firehose = new FirehoseSubscription(db, cfg.subscriptionEndpoint)

    const server = createServer({
      validateResponse: true,
      payload: {
        jsonLimit: 100 * 1024, // 100kb
        textLimit: 100 * 1024, // 100kb
        blobLimit: 5 * 1024 * 1024, // 5mb
      },
    })
    feedGeneration(server, db)
    app.use(server.xrpc.router)

    return new FeedGenerator(app, db, firehose, cfg)
  }

  async start(): Promise<http.Server> {
    await this.firehose.run()
    const server = this.app.listen(this.cfg.port)
    server.keepAliveTimeout = 90000
    this.server = server
    await events.once(server, 'listening')
    return server
  }
}

export default FeedGenerator
