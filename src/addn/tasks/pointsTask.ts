import workerpool from 'workerpool'
import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask, TaskSessionData } from './task.js'
import path from 'path'
import { Database } from '../../db/index.js'

export class PointsTask implements ITask {
  public name = 'top_members'
  private periodicIntervalId: NodeJS.Timer | undefined
  private db: Database

  // create a worker pool using an external worker script
  private __dirname = path.resolve(path.dirname(''))
  private pool = workerpool.pool(
    this.__dirname + '/dist/addn/workers/topMembersService.js',
  )

  public run = (interval: number, agent: BskyAgent, db: Database) => {
    this.db = db

    const timer = async () => {
      const shouldRunTask: boolean = await this.checkTask(db)
      if (shouldRunTask) {
        console.log('Points Task: running now')
        try {
          // Call the service working
          const session: AtpSessionData | undefined = agent.session

          if (!session) return

          await this.runService({
            access: session.accessJwt,
            refresh: session.refreshJwt,
            did: session.did,
            handle: session.handle,
            active: session.active,
          })
        } catch (e) {
          console.log(`Points Task: error running periodic task - ${e.message}`)
        }
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  private runService = async (taskSession: TaskSessionData): Promise<any> => {
    let currentPool = this.pool
    return currentPool
      .exec('postTopMembers', [taskSession])
      .then(async () => {
        await this.db
          .insertInto('feed_task')
          .values([{ type: this.name, lastRun: new Date().toISOString() }])
          .onConflict((oc) =>
            oc.column('type').doUpdateSet({
              lastRun: new Date().toISOString(),
            }),
          )
          .execute()
      })
      .catch(function (err) {
        console.error(err)
      })
      .then(function () {
        currentPool.terminate() // terminate all workers when done
      })
  }

  public async checkTask(db: Database): Promise<boolean> {
    //
    const result = await db
      .selectFrom('feed_task')
      .where('type', '=', this.name)
      .selectAll()
      .limit(1)
      .executeTakeFirst()

    const lastRun: number = new Date(result?.lastRun || '').getTime()
    const pastTime: number = new Date().getTime() - 1 * 24 * 60 * 60 * 1000

    return lastRun < pastTime
  }
}
