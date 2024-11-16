import { BskyAgent } from '@atproto/api'
import { getListMembers } from '../listMethods.js'
import { ITask } from './task.js'

export class BannedTask implements ITask {
  private periodicIntervalId: NodeJS.Timer | undefined

  public bannedMembers: string[]

  public run = (interval: number, agent: BskyAgent) => {
    const timer = async () => {
      try {
        // Get Banned Members
        this.bannedMembers = await this.getBanndedMembers(agent)
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

  private getBanndedMembers = async (agent: BskyAgent): Promise<string[]> => {
    // Get banned members from BeyHive banned feed list
    const list: string = `${process.env.BEYHIVE_BAN_LIST}`
    return await getListMembers(list, agent)
  }
}
