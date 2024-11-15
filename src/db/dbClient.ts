import {
  Document,
  Filter,
  MongoClient,
  ObjectId,
  WithoutId,
  SortDirection,
} from 'mongodb'
import dotenv from 'dotenv'
import { InvalidRequestError } from '@atproto/xrpc-server'

dotenv.config()

class dbSingleton {
  private static instance: dbSingleton | null = null
  client: MongoClient | null = null

  constructor(connection_string: string) {
    this.client = new MongoClient(connection_string)
    this.init()
  }

  static getInstance(): dbSingleton {
    if (dbSingleton.instance === null) {
      dbSingleton.instance = new dbSingleton(
        `${process.env.FEEDGEN_MONGODB_CONNECTION_STRING}`,
      )
    }
    return dbSingleton.instance
  }

  async init() {
    if (this.client === null) throw new Error('DB Cannot be null')
    await this.client.connect()
  }

  async deleteManyURI(collection: string, uris: string[]) {
    await this.client
      ?.db()
      .collection(collection)
      .deleteMany({ uri: { $in: uris } })
  }

  async deleteManyDID(collection: string, dids: string[]) {
    await this.client
      ?.db()
      .collection(collection)
      .deleteMany({ did: { $in: dids } })
  }

  async replaceOneURI(collection: string, uri: string, data: any) {
    if (!(typeof data._id === typeof '')) data._id = new ObjectId()
    else {
      data._id = new ObjectId(data._id)
    }

    try {
      await this.client?.db().collection(collection).insertOne(data)
    } catch (err) {
      await this.client
        ?.db()
        .collection(collection)
        .replaceOne({ uri: uri }, data)
    }
  }

  async replaceOneDID(collection: string, did: string, data: any) {
    if (!(typeof data._id === typeof '')) data._id = new ObjectId()
    else {
      data._id = new ObjectId(data._id)
    }

    try {
      await this.client?.db().collection(collection).insertOne(data)
    } catch (err) {
      await this.client
        ?.db()
        .collection(collection)
        .replaceOne({ did: did }, data)
    }
  }

  async getPostBySortWeight(
    collection: string,
    limit = 50,
    cursor: string | undefined = undefined,
  ) {
    let start = 0

    if (cursor !== undefined) {
      start = Number.parseInt(cursor)
    }

    const posts = await this.client
      ?.db()
      .collection(collection)
      .find({})
      .sort({ sort_weight: -1 })
      .skip(start)
      .limit(limit)
      .toArray()

    if (posts?.length !== undefined && posts.length > 0) return posts
    else return []
  }

  async aggregatePostsByRepliesToCollection(
    collection: string,
    tag: string,
    threshold: number,
    out: string,
    limit: number = 10000,
  ) {
    const indexedAt = new Date().getTime()

    await this.client
      ?.db()
      .collection(collection)
      .aggregate([
        { $match: { algoTags: tag, replyRoot: { $ne: null } } },
        {
          $group: {
            _id: '$replyRoot',
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: threshold } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $addFields: { indexedAt: indexedAt } },
        { $merge: { into: out, on: '_id' } },
      ])
      .toArray()

    await this.client
      ?.db()
      .collection(out)
      .deleteMany({ indexedAt: { $ne: indexedAt } })
  }

  async getCollection(collection: string) {
    const ret = await this.client
      ?.db()
      .collection(collection)
      .find({})
      .toArray()
    if (ret) return ret
    else return []
  }

  async insertOrReplaceRecord(
    query: Filter<Document>,
    data: WithoutId<Document>,
    collection: string,
  ) {
    try {
      await this.client?.db().collection(collection).insertOne(data)
    } catch (err) {
      await this.client?.db().collection(collection).replaceOne(query, data)
    }
  }

  async updateSubStateCursor(service: string, cursor: number) {
    await this.client
      ?.db()
      .collection('sub_state')
      .findOneAndReplace(
        { service: service },
        { service: service, cursor: cursor },
        { upsert: true },
      )
  }

  async getSubStateCursor(service: string) {
    const res = await this.client
      ?.db()
      .collection('sub_state')
      .findOne({ service: service })
    if (res === null) return { service: service, cursor: 0 }
    return res
  }

  async getLatestPostsForTag({
    tag,
    limit = 50,
    cursor = undefined,
    mediaOnly = false,
    nsfwOnly = false,
    excludeNSFW = false,
    sortOrder = -1,
  }: {
    tag: string
    limit?: number
    cursor?: string | undefined
    mediaOnly?: boolean
    nsfwOnly?: boolean
    excludeNSFW?: boolean
    sortOrder?: SortDirection
  }) {
    let query: { indexedAt?: any; cid?: any; algoTags: string; $and?: any[] } =
      {
        algoTags: tag,
      }

    const conditions: any[] = []

    if (mediaOnly) {
      conditions.push({
        $or: [
          { 'embed.images': { $ne: null } },
          { 'embed.video': { $ne: null } },
          { 'embed.media': { $ne: null } },
        ],
      })
    }
    if (nsfwOnly) {
      conditions.push({
        labels: {
          $in: ['porn', 'nudity', 'sexual', 'underwear'],
          $ne: null,
        },
      })
    }
    if (excludeNSFW) {
      conditions.push({
        labels: {
          $nin: ['porn', 'nudity', 'sexual', 'underwear'],
          $ne: null,
        },
      })
    }

    if (cursor !== undefined) {
      const [indexedAt, cid] = cursor.split('::')
      if (!indexedAt || !cid) {
        throw new InvalidRequestError('malformed cursor')
      }
      const timeStr = new Date(parseInt(indexedAt, 10)).getTime()

      query['indexedAt'] = { $lte: timeStr }
      query['cid'] = { $ne: cid }
    }

    if (conditions.length > 0) {
      query.$and = conditions
    }

    const results = this.client
      ?.db()
      .collection('post')
      .find(query)
      .sort({ indexedAt: sortOrder, cid: -1 })
      .limit(limit)
      .toArray()

    if (results === undefined) return []
    else return results
  }

  async getTaggedPostsBetween(tag: string, start: number, end: number) {
    const larger = start > end ? start : end
    const smaller = start > end ? end : start

    const results = this.client
      ?.db()
      .collection('post')
      .find({ indexedAt: { $lt: larger, $gt: smaller }, algoTags: tag })
      .sort({ indexedAt: -1, cid: -1 })
      .toArray()

    if (results === undefined) return []
    else return results
  }

  async getUnlabelledPostsWithMedia(limit = 100, lagTime = 5 * 60 * 1000) {
    const results = this.client
      ?.db()
      .collection('post')
      .find({
        $or: [
          { 'embed.images': { $ne: null } },
          { 'embed.video': { $ne: null } },
          { 'embed.media': { $ne: null } },
        ],
        labels: null,
        indexedAt: { $lt: new Date().getTime() - lagTime },
      })
      .sort({ indexedAt: 1, cid: 1 })
      .limit(limit)
      .toArray()

    return results || []
  }

  async updateLabelsForURIs(postEntries: { uri: string; labels: string[] }[]) {
    for (let i = 0; i < postEntries.length; i++) {
      this.client
        ?.db()
        .collection('post')
        .findOneAndUpdate(
          { uri: { $eq: postEntries[i].uri } },
          { $set: { labels: postEntries[i].labels } },
        )
    }
  }

  async getRecentAuthorsForTag(tag: string, lastMs: number = 600000) {
    const results = await this.client
      ?.db()
      .collection('post')
      .distinct('author', {
        indexedAt: { $gt: new Date().getTime() - lastMs },
        algoTags: tag,
      })

    if (results === undefined) return []
    else return results
  }

  async getDistinctFromCollection(collection: string, field: string) {
    const results = await this.client
      ?.db()
      .collection(collection)
      .distinct(field)
    if (results === undefined) return []
    else return results
  }

  async removeTagFromPostsForAuthor(tag: string, authors: string[]) {
    const pullQuery: Record<string, any> = { algoTags: { $in: [tag] } }
    await this.client
      ?.db()
      .collection('post')
      .updateMany({ author: { $in: authors } }, { $pull: pullQuery })

    await this.deleteUntaggedPosts()
  }

  async removeTagFromOldPosts(tag: string, indexedAt: number) {
    const pullQuery: Record<string, any> = { algoTags: { $in: [tag] } }
    await this.client
      ?.db()
      .collection('post')
      .updateMany({ indexedAt: { $lt: indexedAt } }, { $pull: pullQuery })

    await this.deleteUntaggedPosts()
  }

  async deleteUntaggedPosts() {
    await this.client
      ?.db()
      .collection('post')
      .deleteMany({ algoTags: { $size: 0 } })
  }

  async getPostForURI(uri: string) {
    const results = await this.client
      ?.db()
      .collection('post')
      .findOne({ uri: uri })
    if (results === undefined) return null
    return results
  }
}

const dbClient = dbSingleton.getInstance()

export default dbClient
