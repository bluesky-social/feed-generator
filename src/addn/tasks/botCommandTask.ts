import workerpool from 'workerpool'
import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask, TaskSessionData } from './task.js'
import path from 'path'

export interface BotCommand {
  type: 'points' | 'help' | 'members_list' | 'ban_list'
  userDid: string
  uri: string
}

export class BotCommandTask implements ITask {
  private periodicIntervalId: NodeJS.Timer | undefined
  private commands: BotCommand[] = []

  // create a worker pool using an external worker script
  private __dirname = path.resolve(path.dirname(''))
  private pool = workerpool.pool(
    this.__dirname + '/dist/addn/workers/botCommandService.js',
  )

  public run = (interval: number, agent: BskyAgent) => {
    const timer = async () => {
      try {
        // Call the service worker
        const session: AtpSessionData | undefined = agent.session

        if (!session) return
        if (this.commands.length == 0) return

        const result = await this.runService(
          {
            access: session.accessJwt,
            refresh: session.refreshJwt,
            did: session.did,
            handle: session.handle,
            active: session.active,
          },
          this.commands.shift(),
        )
      } catch (e) {
        console.log(
          `Bot Command Task: error running periodic task - ${e.message}`,
        )
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  public addCommand = (command: BotCommand) => {
    this.commands.push(command)
  }

  private runService = async (
    taskSession: TaskSessionData,
    commands: BotCommand | undefined,
  ): Promise<any> => {
    let currentPool = this.pool
    return currentPool
      .exec('processBotCommand', [taskSession, commands])
      .catch(function (err) {
        console.error(err)
      })
      .then(function () {
        currentPool.terminate() // terminate all workers when done
      })
  }
}
