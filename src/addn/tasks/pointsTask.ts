import { BskyAgent } from '@atproto/api'
import { getListMembers } from '../listMethods.js'
import { ITask } from './task.js'
import { Database } from '../../db/index.js'

export class PointsTask implements ITask {
  private periodicIntervalId: NodeJS.Timer | undefined

  public run = (interval: number, db: Database) => {
    const timer = async () => {
      console.log('Points Task: running now')
      try {
        // Clean old posts from database
        await this.cleanupOldPosts(db)
      } catch (e) {
        console.log(`Points Task: error running periodic task - ${e.message}`)
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  private cleanupOldPosts = async (db: Database): Promise<void> => {
    const pastTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000
    await db
      .deleteFrom('post')
      .where('indexedAt', '<', new Date(pastTime).toISOString())
      .execute()
  }
}
