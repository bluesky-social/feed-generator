import workerpool from 'workerpool'
import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask } from './task.js'
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
      // Create a temp array of members we can process
      const tempMembers: string[] = this.newMembers

      try {
        if (this.newMembers.length == 0) return

        // Remove temp members from the newMembers array while they are being processed
        this.newMembers = []

        // Call the service working
        const session: AtpSessionData | undefined = agent.session

        if (!session) return

        const result = await this.runService(
          session.accessJwt,
          session.refreshJwt,
          session.did,
          session.handle,
          session.active,
          tempMembers,
        )
      } catch (e) {
        // Reset newMembers Array
        this.newMembers = this.newMembers.concat(tempMembers)

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
    access: string,
    refresh: string,
    did: string,
    handle: string,
    active: boolean,
    members: string[],
  ): Promise<void> => {
    let currentPool = this.pool
    return currentPool
      .exec('sendWelcomeMessage', [
        access,
        refresh,
        did,
        handle,
        active,
        members,
      ])
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
