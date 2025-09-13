import http from 'http'
import events from 'events'
import express from 'express'
import { DidResolver, MemoryCache } from '@atproto/identity'
import { AtpAgent } from '@atproto/api'
import { createServer } from './lexicon'
import feedGeneration from './methods/feed-generation'
import describeGenerator from './methods/describe-generator'
import { createDb, Database, migrateToLatest } from './db'
import { FirehoseSubscription } from './subscription'
import { AppContext, Config } from './config'
import wellKnown from './well-known'

export class FeedGenerator {
  public app: express.Application
  public server?: http.Server
  public db: Database
  public firehose: FirehoseSubscription
  public agent?: AtpAgent
  public cfg: Config

  constructor(
    app: express.Application,
    db: Database,
    firehose: FirehoseSubscription,
    cfg: Config,
    agent?: AtpAgent,
  ) {
    this.app = app
    this.db = db
    this.firehose = firehose
    this.cfg = cfg
    this.agent = agent
  }

  static create(cfg: Config) {
    const app = express()
    const db = createDb(cfg.sqliteLocation)
    const firehose = new FirehoseSubscription(db, cfg.subscriptionEndpoint)

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

    let agent: AtpAgent | undefined = undefined
    if (cfg.handle && cfg.appPassword) {
      agent = new AtpAgent({ service: 'https://bsky.social' })
    }

    return new FeedGenerator(app, db, firehose, cfg, agent)
  }

  async backfill() {
    if (!this.agent) {
      console.log('No agent for backfill, skipping')
      return
    }
    console.log('Backfilling posts...')
    try {
      await this.agent.login({
        identifier: this.cfg.handle!,
        password: this.cfg.appPassword!,
      })
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      // 1. Search for text 'fragen.navy'
      const textResults = await this.agent.api.app.bsky.feed.searchPosts({
        q: 'fragen.navy',
        limit: 100,
      })
      const textPosts = textResults.data.posts.filter(
        (p) => new Date(p.indexedAt) > twoWeeksAgo,
      )

      // 2. Search for 'navyfragen' and check alt text
      const altTextResults = await this.agent.api.app.bsky.feed.searchPosts({
        q: 'navyfragen',
        limit: 100,
      })
      const altTextPosts = altTextResults.data.posts.filter((post) => {
        if (new Date(post.indexedAt) < twoWeeksAgo) return false

        let imageAltMatch = false
        if (
          post.embed &&
          post.embed.$type === 'app.bsky.embed.images#view' &&
          'images' in post.embed &&
          Array.isArray((post.embed as any).images)
        ) {
          for (const image of (post.embed as any).images) {
            if (
              image &&
              typeof image.alt === 'string' &&
              image.alt.toLowerCase().includes('navyfragen')
            ) {
              imageAltMatch = true
              break
            }
          }
        }
        return imageAltMatch
      })

      const allPosts = [...textPosts, ...altTextPosts]
      const uniqueUris = new Set<string>()
      const uniquePosts = allPosts.filter((post) => {
        if (uniqueUris.has(post.uri)) {
          return false
        }
        uniqueUris.add(post.uri)
        return true
      })

      const postsToCreate = uniquePosts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        indexedAt: new Date(post.indexedAt).toISOString(),
      }))

      if (postsToCreate.length > 0) {
        console.log(`Backfilling ${postsToCreate.length} posts`)
        await this.db
          .insertInto('post')
          .values(postsToCreate)
          .onConflict((oc) => oc.doNothing())
          .execute()
      }
    } catch (err) {
      console.error('Backfill error', err)
    }
  }

  async start(): Promise<http.Server> {
    await migrateToLatest(this.db)
    await this.backfill()
    this.firehose.run(this.cfg.subscriptionReconnectDelay)
    this.server = this.app.listen(this.cfg.port, this.cfg.listenhost)
    await events.once(this.server, 'listening')
    return this.server
  }
}

export default FeedGenerator