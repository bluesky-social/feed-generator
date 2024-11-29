import WebSocket from 'ws'
import { Jetstream } from '@skyware/jetstream'
import { Database } from './db/index.js'
import { BskyAgent } from '@atproto/api'
import {
  AuthorTask,
  BannedTask,
  BotCommandTask,
  CleanupTask,
  NewMemberTask,
  PointsTask,
  FollowsTask,
} from './addn/tasks/index.js'
import { Post } from './db/schema.js'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export class JetStreamManager {
  private authorTask = new AuthorTask()
  private bannedTask = new BannedTask()
  private cleanupTask = new CleanupTask()
  private botCommandTask = new BotCommandTask()
  private newMemberTask = new NewMemberTask()
  private pointsTask = new PointsTask()
  private followsTask = new FollowsTask()
  private db: Database
  private isAdminMode: boolean
  public jetstream: Jetstream
  private botId: string

  // Init
  async init(db: Database, isAdminMode: boolean) {
    this.db = db
    this.isAdminMode = isAdminMode
    this.botId = process.env.BOT_PUBLISHER_DID || ''

    // Login Agent
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    const handle = `${process.env.BOT_HANDLE}`
    const password = `${process.env.BOT_PASSWORD}`

    await agent.login({ identifier: handle, password }).then(async () => {
      // Run Tasks
      this.runTasks(agent)
    })

    this.initJetstream()
  }

  runTasks(agent: BskyAgent) {
    if (!this.isAdminMode) {
      this.authorTask.run(1 * 60 * 1000, agent)
      this.newMemberTask.run(2 * 1000, agent)
      this.bannedTask.run(10 * 60 * 1000, agent)
      this.cleanupTask.run(24 * 60 * 60 * 1000, this.db)
      this.botCommandTask.run(2 * 1000, agent)
      this.pointsTask.run(10 * 60 * 1000, agent, this.db)
      this.followsTask.run(1 * 60 * 1000, agent, this.db)
    }
  }

  initJetstream() {
    // Jetstream
    this.jetstream = new Jetstream({
      endpoint: `${process.env.JETSTREAM_ENDPOINT}`,
      ws: WebSocket,
      wantedCollections: ['app.bsky.feed.post', 'app.bsky.graph.follow'],
      cursor: new Date().getTime(),
    })

    // Posts
    this.jetstream.onCreate(
      'app.bsky.feed.post',
      this.handleCreatePostEvent.bind(this),
    )

    // Follows
    this.jetstream.onCreate(
      'app.bsky.graph.follow',
      this.handleCreateFollowEvent.bind(this),
    )

    // Delete
    /*this.jetstream.onDelete(
      'app.bsky.feed.post',
      this.handleDeletePostEvent.bind(this),
    )*/

    this.jetstream.start()
  }

  async handleCreatePostEvent(event) {
    const {
      commit: { record, rkey, cid },
      did,
    } = event
    const uri = `at://${did}/app.bsky.feed.post/${rkey}`
    const author: string = did
    let hashtags: any[] = []
    let newJoin: boolean = false
    let isMember: boolean = false

    // Ignore banned members
    if (this.bannedTask.bannedMembers.includes(author)) {
      console.log('This author is banned: ', author)
      return
    }

    // Filter for posts that include the join/leave hashtags
    record['text']
      ?.toLowerCase()
      ?.match(/#[^\s#\W\;]*/gim)
      ?.map((hashtag) => {
        hashtags.push(hashtag)
      })

    // Let the bot handle posts
    this.handleBotMessages(uri, record, rkey, did, hashtags)

    // Add the Author
    if (hashtags.includes('#joinbeyhive')) {
      if (this.authorTask.addAuthor(author)) {
        this.newMemberTask.addMember({
          author,
          uri,
        })
        newJoin = true
      } else {
        return
      }
    }

    // Hide new member posts from bot
    if (author == this.botId && hashtags.includes('#newmember')) {
      return
    }

    // Remove the Author
    if (hashtags.includes('#leavebeyhive')) {
      if (this.authorTask.Authors.includes(author)) {
        this.authorTask.removeAuthor(author)
      }
      return
    }

    // Check if this is a reply (if it is, don't process)
    //if (record.hasOwnProperty('reply')) {
    //  return
    //}

    if (
      !this.authorTask.Authors.includes(author) &&
      !newJoin &&
      process.env.LIMIT_NON_AUTHORS === 'true'
    ) {
      // Only allow if there's a #BEYHIVE hashtag
      if (!hashtags.includes('#beyhive')) {
        return
      }
    } else {
      if (this.authorTask.Authors.includes(author)) {
        isMember = true
      }
    }

    // only beyonce/beyhive posts
    const re =
      /^(?!.*(beyboons|haghive|hasbeyn)).*\b(beyhive|beyoncé|beyonce|sasha fierce|yonce|cowboy carter)\b.*$/imu

    let match = false

    let matchString = record['text'].toLowerCase()

    const normalizedString = removeAccents(matchString)

    if (normalizedString.match(re) !== null) {
      match = true
    }

    if (!match) return

    const post: Post = {
      uri,
      cid: cid,
      indexedAt: record.createdAt,
      replyParent: null,
      replyRoot: null,
      pinned: false,
    }

    console.log('Committing message to DB: ', post.uri)

    // Don't commit to DB in admin mode
    if (this.isAdminMode) {
      return
    }

    await this.db
      .insertInto('post')
      .values([post])
      .onConflict((oc) => oc.doNothing())
      .execute()

    // Increment points for members
    if (isMember && author !== this.botId) {
      await this.db
        .insertInto('member_points')
        .values([{ did: author, points: 1, dailyPoints: 1 }])
        .onConflict((oc) =>
          oc.column('did').doUpdateSet({
            points: (eb) => eb('member_points.points', '+', 1),
            dailyPoints: (eb) => eb('member_points.dailyPoints', '+', 1),
          }),
        )
        .execute()
    }

    return
  }

  async handleCreateFollowEvent({ commit: { record }, did }) {
    if (record.subject === this.botId) {
      console.log('BOT got a follow')
      if (this.authorTask.addAuthor(did)) {
        this.followsTask.follow(did)
        this.newMemberTask.addMember({
          author: did,
        })
      }
    }
  }

  /*async handleDeletePostEvent(event) {
    await this.db
      .deleteFrom('post')
      .where('uri', 'in', [
        `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      ])
      .execute()
  }*/

  handleBotMessages(
    uri: string,
    record: any,
    rkey: any,
    did: string,
    hashtags: any[],
  ) {
    // Don't process if the bot has sent a command to itself
    if (did == this.botId) return

    // Check which command was sent (and how it was sent)
    if (record.reply?.parent?.uri?.includes(`at://${this.botId}`)) {
      // Is a bot reply
      console.log('BOT got a reply')

      // POINTS COMMAND
      if (hashtags.includes('#beypoints')) {
        this.botCommandTask.addCommand({
          type: 'points',
          userDid: did,
          uri,
        })
        return
      }

      // HELP COMMAND
      if (hashtags.includes('#help')) {
        this.botCommandTask.addCommand({
          type: 'help',
          userDid: did,
          uri,
        })
        return
      }
    } else if (
      this.is('app.bsky.embed.record', record.embed) &&
      record.embed.record.uri.includes(`at://${this.botId}`)
    ) {
      // Is a bot quote
    } else if (
      this.is('app.bsky.embed.recordWithMedia', record.embed) &&
      record.embed.record.record.uri.includes(`at://${this.botId}`)
    ) {
      // Is a bot quote
    } else if (
      record.facets?.some((facet) =>
        facet.features.some(
          (feature) =>
            this.is('app.bsky.richtext.facet#mention', feature) &&
            feature.did === this.botId,
        ),
      )
    ) {
      // Is a mention
      console.log('BOT got a mention')

      // POINTS COMMAND
      if (hashtags.includes('#beypoints')) {
        this.botCommandTask.addCommand({
          type: 'points',
          userDid: did,
          uri,
        })
        return
      }

      // HELP COMMAND
      if (hashtags.includes('#help')) {
        this.botCommandTask.addCommand({
          type: 'help',
          userDid: did,
          uri,
        })
        return
      }
    }
  }

  is(lexicon, obj) {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      '$type' in obj &&
      (obj.$type === lexicon || obj.$type === lexicon + '#main')
    )
  }
}
