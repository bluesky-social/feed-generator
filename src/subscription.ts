import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos.js'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription.js'
import { Database } from './db/index.js'
import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'
import getListFeed from './addn/getListFeed.js'
import { AuthorTask } from './addn/tasks/authorTask.js'
import { BannedTask } from './addn/tasks/bannedTask.js'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  private authorTask = new AuthorTask()
  private bannedTask = new BannedTask()

  constructor(db: Database, service: string) {
    super(db, service)

    this.init(db)
  }

  // Init
  async init(db: Database) {
    dotenv.config()

    // Login Agent
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    const handle = `${process.env.FEEDGEN_HANDLE}`
    const password = `${process.env.FEEDGEN_PASSWORD}`

    /*await agent.login({ identifier: handle, password }).then(async () => {
      // Run Tasks
      this.authorTask.run(1, agent)
      this.bannedTask.run(10, agent)
    })*/
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    /*for (const post of ops.posts.creates) {
      console.log(post)
    }*/
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // Ignore banned members
        if (this.bannedTask.bannedMembers) {
          if (this.bannedTask.bannedMembers.includes(create?.author)) {
            console.log('This author is banned: ', create?.author)
            return false
          }
        }

        // Filter for posts that include the join/leave hashtags
        let hashtags: any[] = []
        create?.record?.text
          ?.toLowerCase()
          ?.match(/#[^\s#\.\;]*/gim)
          ?.map((hashtag) => {
            hashtags.push(hashtag)
          })

        // Add the Author
        if (hashtags.includes('#joinbeyhive')) {
          console.log('Author: adding author = ', create?.author)
          this.authorTask.addAuthor(create?.author)
        }

        // Remove the Author
        if (hashtags.includes('#leavebeyhive')) {
          console.log('Author: removing author = ', create?.author)
          this.authorTask.removeAuthor(create?.author)
          return false
        }

        // Check if this is a reply (if it is, don't process)
        if (create?.record?.hasOwnProperty('reply')) {
          if (create.record.reply?.root !== null) return false
        }

        if (this.authorTask.Authors?.length > 0) {
          if (!this.authorTask.Authors.includes(create.author)) {
            // Only allow if there's a #BEYHIVE hashtag
            return hashtags.includes('#beyhive')
          }
          console.log('Author access granted: ', create.author)
        } else {
          return false
        }
        // only alf-related posts
        const re =
          /^(?!.*(#beyboons|#haghive|haghive|hasbeyn)).*\b(beyonce|beyhive|beyoncé|sasha fierce|bey|yonce|yoncé|#beyonce)\b.*$/imu

        let match = false

        let matchString = create.record.text.toLowerCase()

        const normalizedString = removeAccents(matchString)

        if (normalizedString.match(re) !== null) {
          match = true
        }

        return match
      })
      .map((create) => {
        // map beyhive posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
