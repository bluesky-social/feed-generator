import { Database } from './db/index.js'
import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'
import getListFeed from './addn/getListFeed.js'
import { AuthorTask } from './addn/tasks/authorTask.js'
import { BannedTask } from './addn/tasks/bannedTask.js'
import { AppContext } from './config.js'

export class PeriodicTasks {
  private authorTask = new AuthorTask()
  private bannedTask = new BannedTask()

  constructor(ctx: AppContext, db: Database) {
    this.init(db)
  }

  // Init
  async init(db: Database) {
    dotenv.config()

    // Login Agent
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    const handle = `${process.env.FEEDGEN_HANDLE}`
    const password = `${process.env.FEEDGEN_PASSWORD}`

    await agent.login({ identifier: handle, password }).then(async () => {
      // Run Tasks
      this.authorTask.run(1 * 60 * 1000, agent)
      this.bannedTask.run(10 * 60 * 1000, agent)
    })

    // Get feed
    let feed = await getListFeed(
      'https://bsky.app/profile/mikehuntington.com/feed/beyhive',
      agent,
    )
  }
}
