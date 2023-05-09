import http from 'http'
import events from 'events'
import express from 'express'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import { createServer } from './lexicon'
import feedGeneration from './feed-generation'
import { createDb, Database } from './db'

export class FeedGenerator {
  public app: express.Application
  public server?: http.Server
  public db: Database
  private terminator?: HttpTerminator

  constructor(app: express.Application, db: Database) {
    this.app = app
  }

  static create() {
    const app = express()
    const db = createDb('test.sqlite')

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

    return new FeedGenerator(app, db)
  }

  async start(): Promise<http.Server> {
    const server = this.app.list(3000)
    server.keepAliveTimeout = 90000
    this.terminator = createHttpTerminator({ server })
    this.server = server
    await events.once(server, 'listening')
    return server
  }

  async destroy(): Promise<void> {
    await this.terminator?.terminate()
  }
}
