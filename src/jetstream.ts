import WebSocket from 'ws'
import { Jetstream } from '@skyware/jetstream'
import { Database } from './db/index.js'
import { BskyAgent } from '@atproto/api'
import { AuthorTask } from './addn/tasks/authorTask.js'
import { BannedTask } from './addn/tasks/bannedTask.js'
import { NewMemberTask } from './addn/tasks/newMemberTask.js'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export class JetStreamManager {
  private authorTask = new AuthorTask()
  private bannedTask = new BannedTask()
  private newMemberTask = new NewMemberTask()
  private db: Database
  public jetstream: Jetstream

  // Init
  async init(db: Database) {
    this.db = db

    // Login Agent
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    const handle = `${process.env.BOT_HANDLE}`
    const password = `${process.env.BOT_PASSWORD}`

    await agent.login({ identifier: handle, password }).then(async () => {
      // Run Tasks
      this.authorTask.run(1 * 60 * 1000, agent)
      this.bannedTask.run(10 * 60 * 1000, agent)

      if (agent.session) this.newMemberTask.run(10 * 1000, agent.session)
    })

    this.initJetstream()
  }

  initJetstream() {
    // Jetstream
    this.jetstream = new Jetstream({
      ws: WebSocket,
      wantedCollections: ['app.bsky.feed.post'], // omit to receive all collections
      //wantedDids: ['did:plc:dvej7nvbmmusifxfeund54cz'], // omit to receive events from all dids
    })

    this.jetstream.onCreate(
      'app.bsky.feed.post',
      this.handleCreateEvent.bind(this),
    )
    this.jetstream.onDelete(
      'app.bsky.feed.post',
      this.handleDeleteEvent.bind(this),
    )

    this.jetstream.start()
  }

  async handleCreateEvent(event) {
    let author: string = event.did
    let hashtags: any[] = []
    let newJoin: boolean = false

    // Ignore banned members
    if (this.bannedTask.bannedMembers.includes(author)) {
      console.log('This author is banned: ', author)
      return
    }

    // Filter for posts that include the join/leave hashtags
    event.commit?.record['text']
      ?.toLowerCase()
      ?.match(/#[^\s#\.\;]*/gim)
      ?.map((hashtag) => {
        hashtags.push(hashtag)
      })

    // Add the Author
    if (hashtags.includes('#joinbeyhive')) {
      if (this.authorTask.addAuthor(author)) {
        console.log('Author: adding author = ', author)
        this.newMemberTask.addMember(event.did)
        newJoin = true
      } else {
        return
      }
    }

    // Remove the Author
    if (hashtags.includes('#leavebeyhive')) {
      if (this.authorTask.Authors.includes(author)) {
        console.log('Author: removing author = ', author)
        this.authorTask.removeAuthor(author)
      }
      return
    }

    // Check if this is a reply (if it is, don't process)
    if (event.commit.record.hasOwnProperty('reply')) {
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
    }

    // only beyonce/beyhive posts
    const re =
      /^(?!.*(beyboons|haghive|hasbeyn)).*\b(beyhive|beyoncé|beyonce|sasha fierce|yonce)\b.*$/imu

    let match = false

    let matchString = event.commit.record['text'].toLowerCase()

    const normalizedString = removeAccents(matchString)

    if (normalizedString.match(re) !== null) {
      match = true
    }

    if (!match) return

    const post = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      indexedAt: new Date().toISOString(),
    }

    console.log('Committing message to DB: ', post)

    await this.db
      .insertInto('post')
      .values([post])
      .onConflict((oc) => oc.doNothing())
      .execute()

    return
  }

  async handleDeleteEvent(event) {
    await this.db
      .deleteFrom('post')
      .where('uri', 'in', [
        `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      ])
      .execute()
  }
}
