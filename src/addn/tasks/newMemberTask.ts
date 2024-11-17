import { Worker, isMainThread, workerData, parentPort } from 'worker_threads'
import { AtpSessionData, BskyAgent, CredentialSession } from '@atproto/api'
import { ITask } from './task.js'
import path from 'path'

export class NewMemberTask implements ITask {
  public newMembers: string[] = []

  private __dirname = path.resolve(path.dirname(''))
  private workerPath = path.join(
    this.__dirname,
    '',
    'dist/addn/workers/welcomeImageService.js',
  )

  public run = (interval: number, session: AtpSessionData) => {
    let periodicIntervalId: NodeJS.Timer | undefined

    const timer = async () => {
      // Create a temp array of members we can process
      const tempMembers: string[] = this.newMembers

      try {
        if (this.newMembers.length === 0) return

        // Remove temp members from the newMembers array while they are being processed
        this.newMembers = []

        // Call the service working
        const result = await this.runService(
          session.accessJwt,
          session.refreshJwt,
          session.did,
          session.handle,
          session.active,
          tempMembers,
        )

        // Service a success
        console.log(
          `New Member Task: completed for ${result.membersAdded.length} members`,
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
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerPath, {
        workerData: { access, refresh, did, handle, active, members },
      })
      worker.on('message', resolve)
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`))
      })
    })
  }

  public addMember = (author: string) => {
    if (this.newMembers.includes(author)) return
    this.newMembers.push(author)
  }
}
