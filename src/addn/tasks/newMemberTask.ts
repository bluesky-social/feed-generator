import { Worker } from 'worker_threads'
import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask, TaskSessionData } from './task.js'
import path from 'path'

export interface NewMemberData {
  author: string
  uri?: string
}

export class NewMemberTask implements ITask {
  public newMembers: NewMemberData[] = []

  private __dirname = path.resolve(path.dirname(''))
  private workerPath = path.join(
    this.__dirname,
    '',
    'dist/addn/workers/welcomeImageService.js',
  )

  public run = (interval: number, agent: BskyAgent) => {
    let periodicIntervalId: NodeJS.Timer | undefined

    const timer = async () => {
      try {
        if (this.newMembers.length === 0) return

        // Call the service working
        const session: AtpSessionData | undefined = agent.session

        if (!session) return

        await this.runService(
          {
            access: session.accessJwt,
            refresh: session.refreshJwt,
            did: session.did,
            handle: session.handle,
            active: session.active,
          },
          this.newMembers.shift(),
        )

        // Service a success
        console.log(`New Member Task: completed!`)
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
    member: NewMemberData | undefined,
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerPath, {
        workerData: { taskSession, member },
      })
      worker.on('message', resolve)
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`))
      })
    })
  }

  public addMember = (author: NewMemberData) => {
    if (this.newMembers.includes(author)) return
    this.newMembers.push(author)
  }
}
