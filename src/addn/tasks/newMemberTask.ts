import workerpool from 'workerpool'
import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask, TaskSessionData } from './task.js'
import path from 'path'

export class NewMemberTask implements ITask {
  public newMembers: string[] = []

  // create a worker pool using an external worker script
  private __dirname = path.resolve(path.dirname(''))
  private pool = workerpool.pool(
    this.__dirname + '/dist/addn/workers/welcomeImageService.js',
  )

  public run = (interval: number, agent: BskyAgent) => {
    let periodicIntervalId: NodeJS.Timer | undefined

    const timer = async () => {
      try {
        if (this.newMembers.length == 0) return

        // Call the service working
        const session: AtpSessionData | undefined = agent.session

        if (!session) return

        const result = await this.runService(
          {
            access: session.accessJwt,
            refresh: session.refreshJwt,
            did: session.did,
            handle: session.handle,
            active: session.active,
          },
          this.newMembers.shift(),
        )
      } catch (e) {
        // Service failed
        console.log(
          `New Member Task: error running periodic task - ${e.message}`,
        )
      }
    }

    if (!periodicIntervalId) {
      periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  private runService = async (
    taskSession: TaskSessionData,
    member: string | undefined,
  ): Promise<void> => {
    let currentPool = this.pool
    return currentPool
      .exec('sendWelcomeMessage', [taskSession, member])
      .catch(function (err) {
        console.error(err)
      })
      .then(function () {
        currentPool.terminate() // terminate all workers when done
      })
  }

  public addMember = (author: string) => {
    if (this.newMembers.includes(author)) return
    this.newMembers.push(author)
  }
}
