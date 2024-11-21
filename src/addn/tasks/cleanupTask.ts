import { ITask } from './task.js'
import { Database } from '../../db/index.js'

export class CleanupTask implements ITask {
  public name: string = 'cleanup'
  private periodicIntervalId: NodeJS.Timer | undefined

  public run = (interval: number, db: Database) => {
    const timer = async () => {
      console.log('Cleanup Task: running now')
      try {
        // Clean old posts from database
        await this.cleanupOldPosts(db)
      } catch (e) {
        console.log(`Cleanup Task: error running periodic task - ${e.message}`)
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

  public checkTask: (db: Database) => Promise<boolean>
}
