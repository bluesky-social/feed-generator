import { IngesterEvent } from 'atingester'
import { CID } from 'multiformats/cid'
import { BlobRef, JsonBlobRef } from '@atproto/lexicon'
import { type Database } from './db'
import { ids, lexicons } from './lexicon/lexicons'
import { Main as Images } from './lexicon/types/app/bsky/embed/images'
import { Main as RecordWithMedia } from './lexicon/types/app/bsky/embed/recordWithMedia'
import { Main as Video } from './lexicon/types/app/bsky/embed/video'
import { Record as PostRecord } from './lexicon/types/app/bsky/feed/post'
import { Record as RepostRecord } from './lexicon/types/app/bsky/feed/repost'
import { Record as LikeRecord } from './lexicon/types/app/bsky/feed/like'
import { Record as FollowRecord } from './lexicon/types/app/bsky/graph/follow'

let i = 0
export const handleEvent = async (evt: IngesterEvent, db: Database): Promise<void> => {
  i++
  if (i % 100 === 0) {
    const now = new Date()
    now.setDate(now.getDate() - 1)
    const timeStr = now.toISOString()
    await db
      .deleteFrom('post')
      .where('post.indexedAt', '<', timeStr)
      .execute()
  }

  if (evt.event === 'create') {
    if (evt.collection === ids.AppBskyFeedPost && isPost(evt.record)) {
      let searchtext: string = evt.record.text
      let isMedia: boolean = false
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
      if (evt.record.langs?.includes('ja') || searchtext.match(/^.*[ぁ-んァ-ヶｱ-ﾝﾞﾟー]+.*$/)) {
        if (typeof evt.record.reply === 'undefined') {
          await db
            .insertInto('post')
            .values({
              uri: evt.uri.toString(),
              cid: evt.cid.toString(),
              indexedAt: new Date().toISOString(),
              isMedia: `${isMedia}`,
              isVideo: `${isVideo(evt.record.embed)}`,
            })
            .onConflict((oc) => oc.doNothing())
            .execute()
        }
      }
    } else if (evt.collection === ids.AppBskyFeedRepost && isRepost(evt.record)) {
    } else if (evt.collection === ids.AppBskyFeedLike && isLike(evt.record)) {
    } else if (evt.collection === ids.AppBskyGraphFollow && isFollow(evt.record)) {
    }
  }

  if (evt.event === 'update') {} // updates not supported yet

  if (evt.event === 'delete') {
    if (evt.collection === ids.AppBskyFeedPost) {
      await db
        .deleteFrom('post')
        .where('uri', '=', evt.uri.toString())
        .execute()
    } else if (evt.collection === ids.AppBskyFeedRepost) {
    } else if (evt.collection === ids.AppBskyFeedLike) {
    } else if (evt.collection === ids.AppBskyGraphFollow) {
    }
  }
}

export const isImages = (obj: unknown): obj is Images => {
  return validate(obj, ids.AppBskyEmbedImages)
}

export const isRecordWithMedia = (obj: unknown): obj is RecordWithMedia => {
  return validate(obj, ids.AppBskyEmbedRecordWithMedia)
}

export const isVideo = (obj: unknown): obj is Video => {
  return validate(obj, ids.AppBskyEmbedVideo)
}

export const isPost = (obj: unknown): obj is PostRecord => {
  return isType(obj, ids.AppBskyFeedPost)
}

export const isRepost = (obj: unknown): obj is RepostRecord => {
  return isType(obj, ids.AppBskyFeedRepost)
}

export const isLike = (obj: unknown): obj is LikeRecord => {
  return isType(obj, ids.AppBskyFeedLike)
}

export const isFollow = (obj: unknown): obj is FollowRecord => {
  return isType(obj, ids.AppBskyGraphFollow)
}

const validate = (obj: unknown, nsid: string) => {
  try {
    const result = lexicons.validate(nsid, fixBlobRefs(obj))
    return result.success
  } catch (err) {
    return false
  }
}

const isType = (obj: unknown, nsid: string) => {
  try {
    lexicons.assertValidRecord(nsid, fixBlobRefs(obj))
    return true
  } catch (err) {
    return false
  }
}

// @TODO right now record validation fails on BlobRefs
// simply because multiple packages have their own copy
// of the BlobRef class, causing instanceof checks to fail.
// This is a temporary solution.
const fixBlobRefs = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(fixBlobRefs)
  }
  if (obj && typeof obj === 'object') {
    if (obj.constructor.name === 'BlobRef') {
      const blob = obj as BlobRef
      return new BlobRef(blob.ref, blob.mimeType, blob.size, blob.original)
    }
    if ('$type' in obj && obj.$type === 'blob') {
      if ('ref' in obj && obj.ref && typeof obj.ref === 'object' && '$link' in obj.ref && typeof obj.ref.$link === 'string') {
        obj.ref = CID.parse(obj.ref.$link)
      }
      const json = obj as JsonBlobRef
      return BlobRef.fromJsonRef(json)
    }
    return Object.entries(obj).reduce((acc, [key, val]) => {
      return Object.assign(acc, { [key]: fixBlobRefs(val) })
    }, {} as Record<string, unknown>)
  }
  return obj
}
