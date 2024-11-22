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
  private periodicIntervalId: NodeJS.Timer | undefined

  // Init
  async init(db: Database, isAdminMode: boolean) {
    this.db = db
    this.isAdminMode = isAdminMode

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
    this.authorTask.run(1 * 60 * 1000, agent)
    this.newMemberTask.run(2 * 1000, agent)
    this.followsTask.run(2 * 60 * 1000, agent, this.db)

    if (!this.isAdminMode) {
      this.bannedTask.run(10 * 60 * 1000, agent)
      this.cleanupTask.run(24 * 60 * 60 * 1000, this.db)
      this.botCommandTask.run(2 * 1000, agent)
      this.pointsTask.run(1 * 60 * 60 * 1000, agent, this.db)
    }

    // Follows timer
    const timer = async () => {
      if (this.followsTask.newMembers.length > 0) {
        var selectedMember = this.followsTask.newMembers.shift()
        if (this.authorTask.addAuthor(selectedMember)) {
          this.newMemberTask.addMember({
            author: selectedMember,
          })
        }
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, 10 * 1000)
    }
  }

  initJetstream() {
    // Jetstream
    this.jetstream = new Jetstream({
      endpoint: 'wss://jetstream1.us-west.bsky.network/subscribe',
      ws: WebSocket,
      wantedCollections: ['app.bsky.feed.post'], // omit to receive all collections
      //wantedDids: ['did:plc:dvej7nvbmmusifxfeund54cz'], // omit to receive events from all dids
    })

    // Posts
    this.jetstream.onCreate(
      'app.bsky.feed.post',
      this.handleCreatePostEvent.bind(this),
    )

    // Follows
    /*this.jetstream.onCreate(
      'app.bsky.graph.follow',
      this.handleCreateFollowEvent.bind(this),
    )*/

    // Delete
    /*this.jetstream.onDelete(
      'app.bsky.feed.post',
      this.handleDeletePostEvent.bind(this),
    )*/

    if (this.isAdminMode) {
      this.jetstream.start()
    }
  }

  async handleCreatePostEvent(event) {
    const {
      commit: { record, rkey, cid },
      did,
    } = event
    const botId = process.env.BOT_PUBLISHER_DID
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
    if (author == botId && hashtags.includes('#newmember')) {
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
    if (record.hasOwnProperty('reply')) {
      return
    }

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
      /^(?!.*(beyboons|haghive|hasbeyn)).*\b(beyhive|beyoncé|beyonce|sasha fierce|yonce)\b.*$/imu

    let match = false

    let matchString = record['text'].toLowerCase()

    const normalizedString = removeAccents(matchString)

    if (normalizedString.match(re) !== null) {
      match = true
    }

    if (!match) return

    console.log(event)

    const post = {
      uri,
      cid: cid,
      indexedAt: new Date().toISOString(),
    }

    console.log('Committing message to DB: ', post)

    await this.db
      .insertInto('post')
      .values([post])
      .onConflict((oc) => oc.doNothing())
      .execute()

    // Increment points for members
    if (isMember && author !== botId) {
      await this.db
        .insertInto('member_points')
        .values([{ did: author, points: 0, dailyPoints: 1 }])
        .onConflict((oc) =>
          oc.column('did').doUpdateSet({
            points: (eb) => eb('member_points.points', '+', 1),
          }),
        )
        .execute()
    }

    return
  }

  /*
  async handleCreateFollowEvent({ commit: { record, rkey }, did }) {
    const botId = process.env.BOT_PUBLISHER_DID
    const author = did

    console.log(botId)

    if (record.subject === botId) {
      console.log('BOT got a follow')
      if (this.authorTask.addAuthor(author)) {
        this.newMemberTask.addMember({
          author,
        })
      }
    }
  }
  */

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
    const botId = process.env.BOT_PUBLISHER_DID

    // Don't process if the bot has sent a command to itself
    if (did == botId) return

    // Check which command was sent (and how it was sent)
    if (record.reply?.parent?.uri?.includes(`at://${botId}`)) {
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
      record.embed.record.uri.includes(`at://${botId}`)
    ) {
      // Is a bot quote
    } else if (
      this.is('app.bsky.embed.recordWithMedia', record.embed) &&
      record.embed.record.record.uri.includes(`at://${botId}`)
    ) {
      // Is a bot quote
    } else if (
      record.facets?.some((facet) =>
        facet.features.some(
          (feature) =>
            this.is('app.bsky.richtext.facet#mention', feature) &&
            feature.did === botId,
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
