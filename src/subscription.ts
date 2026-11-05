import { type IngesterEvent } from 'atingester'
import { type DatetimeString, type LexMap } from '@atproto/lex'
import { app } from './lexicons/index.js'
import { type AppContext } from './util/config.js'

let i = 0
export const handleEvent = async (evt: IngesterEvent, ctx: AppContext): Promise<void> => {
  i++
  if ('time_us' in evt && i % 20 === 0) {
    await updateCursor(evt.time_us, ctx)
  } else if ('seq' in evt && evt.seq % 20 === 0) {
    await updateCursor(evt.seq, ctx)
  }

  // This logs the text of every post off the firehose.
  // Just for fun :)
  // Delete before actually using
  if (evt.event === 'create') {
    if (evt.collection === app.bsky.feed.post.$nsid && isPost(evt.record)) {
      console.log(evt.record.text)
    }
  }

  if (evt.event === 'create') {
    if (evt.collection === app.bsky.feed.post.$nsid && isPost(evt.record)) {
      if (evt.record.text.toLowerCase().includes('alf')) {
        await ctx.db
          .insertInto('post')
          .values({
            uri: evt.uri.toString(),
            cid: evt.cid.toString(),
            indexedAt: new Date().toISOString() as DatetimeString,
          })
          .onConflict((oc) => oc.doNothing())
          .execute()
      }
    } else if (evt.collection === app.bsky.feed.repost.$nsid && isRepost(evt.record)) {
    } else if (evt.collection === app.bsky.feed.like.$nsid && isLike(evt.record)) {
    } else if (evt.collection === app.bsky.graph.follow.$nsid && isFollow(evt.record)) {
    }
  }

  if (evt.event === 'update') {} // updates not supported yet

  if (evt.event === 'delete') {
    if (evt.collection === app.bsky.feed.post.$nsid) {
      await ctx.db
        .deleteFrom('post')
        .where('uri', '=', evt.uri.toString())
        .execute()
    } else if (evt.collection === app.bsky.feed.repost.$nsid) {
    } else if (evt.collection === app.bsky.feed.like.$nsid) {
    } else if (evt.collection === app.bsky.graph.follow.$nsid) {
    }
  }
}

const updateCursor = async (cursor: number, ctx: AppContext) => {
  await ctx.db
    .insertInto('sub_state')
    .values({
      service: `${ctx.cfg.subscription.mode}:${ctx.cfg.subscription[ctx.cfg.subscription.mode.toLowerCase()].endpoint}`,
      cursor,
    })
    .onConflict((oc) => oc
      .column('service')
      .where('service', '=', `${ctx.cfg.subscription.mode}:${ctx.cfg.subscription[ctx.cfg.subscription.mode.toLowerCase()].endpoint}`)
      .doUpdateSet({
        cursor: (eb) => eb.ref('excluded.cursor')
      })
    )
    .execute()
}

export const isPost = (obj: LexMap): obj is app.bsky.feed.post.Main => {
  return app.bsky.feed.post.$isTypeOf(obj)
}

export const isRepost = (obj: LexMap): obj is app.bsky.feed.repost.Main => {
  return app.bsky.feed.repost.$isTypeOf(obj)
}

export const isLike = (obj: LexMap): obj is app.bsky.feed.like.Main => {
  return app.bsky.feed.like.$isTypeOf(obj)
}

export const isFollow = (obj: LexMap): obj is app.bsky.graph.follow.Main => {
  return app.bsky.graph.follow.$isTypeOf(obj)
}
