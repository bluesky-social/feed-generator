import { BskyAgent } from '@atproto/api'
import { getListMembers } from '../listMethods.js'
import { ITask } from './task.js'
import { Database } from '../../db/index.js'

export class BannedTask implements ITask {
  public name: string = 'banned'
  private periodicIntervalId: NodeJS.Timer | undefined

  public bannedMembers: string[] = []

  public run = (interval: number, agent: BskyAgent) => {
    const timer = async () => {
      console.log('Banned Task: running now')
      try {
        // Get Banned Members
        const { members } = await this.getBanndedMembers(agent)
        this.bannedMembers = members
      } catch (e) {
        console.log(`Banned Task: error running periodic task - ${e.message}`)
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  private getBanndedMembers = async (
    agent: BskyAgent,
  ): Promise<{ members: string[] }> => {
    // Get banned members from BeyHive banned feed list
    const list: string = `${process.env.BEYHIVE_BAN_LIST}`
    return await getListMembers(list, agent)
  }

  public checkTask: (db: Database) => Promise<boolean>
}
