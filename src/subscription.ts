import { type IngesterEvent } from 'atingester'
import { type DatetimeString, type LexMap } from '@atproto/lex'
import { app } from './lexicons/index.js'
import { type AppContext } from './util/config.js'

let i = 0
export const handleEvent = async (evt: IngesterEvent, ctx: AppContext): Promise<void> => {
  i++
  if (i % 100 === 0) {
    const now = new Date()
    now.setDate(now.getDate() - 1)
    const timeStr = now.toISOString() as DatetimeString
    await ctx.db
      .deleteFrom('post')
      .where('post.indexedAt', '<', timeStr)
      .execute()
  }

  if (evt.event === 'create') {
    if (evt.collection === app.bsky.feed.post.$nsid && isPost(evt.record)) {
      let searchtext: string = evt.record.text
      let isMedia: boolean = false
      if (evt.record.embed) {
        if (isImages(evt.record.embed)) {
          isMedia = true
          for (const image of evt.record.embed.images) searchtext += `\n${image.alt}`
        }
        if (isRecordWithMedia(evt.record.embed) && 'images' in evt.record.embed.media) {
          isMedia = true
          for (const image of evt.record.embed.media.images) searchtext += `\n${image.alt}`
        }
        if (isVideo(evt.record.embed)) {
          isMedia = true
          searchtext += `\n${evt.record.embed.alt}`
        }
      }
      if (evt.record.langs?.includes('ja') || searchtext.match(/^.*[ぁ-んァ-ヶｱ-ﾝﾞﾟー]+.*$/)) {
        if (typeof evt.record.reply === 'undefined') {
          await ctx.db
            .insertInto('post')
            .values({
              uri: evt.uri.toString(),
              cid: evt.cid.toString(),
              indexedAt: new Date().toISOString() as DatetimeString,
              isMedia: `${isMedia}`,
              isVideo: `${isVideo(evt.record.embed ?? {})}`,
            })
            .onConflict((oc) => oc.doNothing())
            .execute()
        }
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

export const isImages = (obj: LexMap): obj is app.bsky.embed.images.Main => {
  return app.bsky.embed.images.$isTypeOf(obj)
}

export const isRecordWithMedia = (obj: LexMap): obj is app.bsky.embed.recordWithMedia.Main => {
  return app.bsky.embed.recordWithMedia.$isTypeOf(obj)
}

export const isVideo = (obj: LexMap): obj is app.bsky.embed.video.Main => {
  return app.bsky.embed.video.$isTypeOf(obj)
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
