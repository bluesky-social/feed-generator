import { Ingester } from 'atingester'
import events from 'events'
import express from 'express'
import { readFile } from 'node:fs/promises'
import http from 'http'
import { IdResolver } from '@atproto/identity'
import { type NsidString } from '@atproto/lex'
import { type LexiconDoc } from '@atproto/lexicon'
import { createServer } from '@atproto/xrpc-server'
import { createDb, migrateToLatest } from './db/index.js'
import * as lex from './lexicons/index.js'
import describeGenerator from './methods/describe-generator.js'
import feedGeneration from './methods/feed-generation.js'
import { handleEvent } from './subscription.js'
import { type AppContext, type FeedGeneratorConfig } from './util/config.js'
import { createLogger } from './util/logger.js'
import wellKnown from './well-known.js'

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

  static async create(
    cfg: FeedGeneratorConfig
  ) {
    const logger = createLogger(['Runner', 'Server'])
    logger.info('Creating server...')

    logger.info(`Creating DB => ${cfg.db.dbLoc}`)
    const db = createDb(cfg.db.dbLoc)

    const app = express()
    const idResolver = new IdResolver()

    const ctx: AppContext = {
      cfg,
      db,
      didResolver: idResolver.did,
      logger,
    }

    const ingesterLogger = createLogger(['Runner', 'Server', 'Ingester'])
    const ingester = new Ingester(cfg.subscription.mode, {
      idResolver,
      handleEvent: async (evt) => await handleEvent(evt, {...ctx, logger: ingesterLogger}),
      onInfo: ingesterLogger.info,
      onError: (err: Error) => ingesterLogger.error(err.message),
      service: cfg.subscription[cfg.subscription.mode.toLowerCase()].endpoint,
      subscriptionReconnectDelay: cfg.subscription.reconnectDelay,
      unauthenticatedCommits: false,
      unauthenticatedHandles: false,
      compress: true,
      filterCollections: [lex.app.bsky.feed.post.$nsid],
      excludeIdentity: true,
      excludeAccount: true,
      excludeCommit: false,
      excludeSync: true,
    })

    const lexicons: LexiconDoc[] = []
    const loadedNsids = readAllNsids(lex)
    for (const nsid of loadedNsids) {
      const path = `./lexicons/${nsid.split('.').join('/')}.json`
      const contents = await readFile(path, 'utf8')
      const lexicon = JSON.parse(contents)
      lexicons.push(lexicon)
    }

    const server = createServer(lexicons, {
      validateResponse: true,
      payload: {
        jsonLimit: 100 * 1024, // 100kb
        textLimit: 100 * 1024, // 100kb
        blobLimit: 5 * 1024 * 1024, // 5mb
      },
    })
    feedGeneration(server, ctx)
    describeGenerator(server, ctx)
    app.use(server.router)
    app.use(wellKnown(ctx))
    
    logger.info('Server has been created!')

    return new FeedGenerator(app, ctx, ingester)
  }

  async start() {
    this.ctx.logger.info('Starting server...')
    await migrateToLatest(this.ctx.db)
    this.ingester.start()
    this.server = this.app.listen(this.ctx.cfg.service.port)
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

const readAllNsids = (lexicons: object): NsidString[] => {
  const nsids: NsidString[] = []
  for (const key in lexicons) {
    const value = lexicons[key]
    if (typeof value === 'object' && value !== null) {
      if ('$nsid' in value && typeof value.$nsid === 'string') {
        nsids.push(value.$nsid)
      }
      nsids.push(...readAllNsids(value))
    }
  }
  return nsids
}

export default FeedGenerator
