import { Ingester } from 'atingester'
import events from 'events'
import express from 'express'
import http from 'http'
import { IdResolver } from '@atproto/identity'
import { createDb, migrateToLatest } from './db'
import { createServer } from './lexicon'
import { ids } from './lexicon/lexicons'
import describeGenerator from './methods/describe-generator'
import feedGeneration from './methods/feed-generation'
import { handleEvent } from './subscription'
import { type AppContext, env } from './util/config'
import { createLogger } from './util/logger'
import wellKnown from './well-known'

export class FeedGenerator {
  public app: express.Application
  public server?: http.Server
  public ctx: AppContext
  public ingester: Ingester

  constructor(
    app: express.Application,
    ctx: AppContext,
    ingester: Ingester
  ) {
    this.app = app
    this.ctx = ctx
    this.ingester = ingester
  }

  static async create() {
    const logger = createLogger(['Runner', 'Server'])
    logger.info('Creating server...')

    logger.info(`Creating DB => ${env.FEEDGEN_SQLITE_LOCATION}`)
    const db = createDb()

    const app = express()
    const idResolver = new IdResolver()

    const ingesterLogger = createLogger(['Runner', 'Server', 'Ingester'])
    const ingester = new Ingester(env.FEEDGEN_SUBSCRIPTION_MODE, {
      idResolver,
      handleEvent: async (evt) => await handleEvent(evt, db),
      onInfo: ingesterLogger.info,
      onError: (err: Error) => ingesterLogger.error(err.message),
      service: env[`FEEDGEN_SUBSCRIPTION_${env.FEEDGEN_SUBSCRIPTION_MODE.toUpperCase()}_ENDPOINT`],
      subscriptionReconnectDelay: env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY,
      unauthenticatedCommits: false,
      unauthenticatedHandles: false,
      compress: true,
      filterCollections: [ids.AppBskyFeedPost],
      excludeIdentity: true,
      excludeAccount: true,
      excludeCommit: false,
      excludeSync: true,
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
      didResolver: idResolver.did,
      logger,
    }
    feedGeneration(server, ctx)
    describeGenerator(server)
    app.use(server.xrpc.router)
    app.use(wellKnown())
    
    logger.info('Server has been created!')

    return new FeedGenerator(app, ctx, ingester)
  }

  async start() {
    this.ctx.logger.info('Starting server...')
    await migrateToLatest(this.ctx.db)
    this.ingester.start()
    this.server = this.app.listen(env.FEEDGEN_PORT, env.FEEDGEN_LISTENHOST)
    await events.once(this.server, 'listening')
    this.ctx.logger.info('Server started')
  }

  async stop() {
    this.ctx.logger.info('Stopping server...')
    await this.ingester.destroy()
    return new Promise<void>((resolve) => {
      this.server?.close(() => {
        this.ctx.logger.info('Server stopped')
        resolve()
      })
    })
  }
}

export default FeedGenerator
