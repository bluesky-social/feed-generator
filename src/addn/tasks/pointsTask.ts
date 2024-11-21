import workerpool from 'workerpool'
import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask, TaskSessionData } from './task.js'
import path from 'path'

export class PointsTask implements ITask {
  private periodicIntervalId: NodeJS.Timer | undefined

  // create a worker pool using an external worker script
  private __dirname = path.resolve(path.dirname(''))
  private pool = workerpool.pool(
    this.__dirname + '/dist/addn/workers/topMembersService.js',
  )

  public run = (interval: number, agent: BskyAgent) => {
    const timer = async () => {
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
      .catch(function (err) {
        console.error(err)
      })
      .then(function () {
        currentPool.terminate() // terminate all workers when done
      })
  }
}
