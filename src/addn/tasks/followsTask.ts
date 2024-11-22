import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask } from './task.js'
import { Database } from '../../db/index.js'
import { getListMembers } from '../listMethods.js'

export class FollowsTask implements ITask {
  public name = 'follows'
  private periodicIntervalId: NodeJS.Timer | undefined
  public newMembers: any[] = []

  public run = (interval: number, agent: BskyAgent, db: Database) => {
    const timer = async () => {
      console.log('Followers Task: running now')
      try {
        await this.getNewFollowers(db, agent)
      } catch (e) {
        console.log(
          `Followers Task: error running periodic task - ${e.message}`,
        )
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)
    }
  }

  public async getNewFollowers(db: Database, agent: BskyAgent): Promise<void> {
    const botId: string = process.env.BOT_PUBLISHER_DID || ''

    const followers = await agent.getFollowers({
      actor: botId,
      limit: 50,
    })

    const list: string = `${process.env.BEYHIVE_FEED_LIST}`
    const listMembers: { members: string[]; uriMap: any[] } =
      await getListMembers(list, agent)

    followers.data.followers.forEach((member) => {
      if (!listMembers.members.includes(member.did)) {
        this.newMembers.push(member.did)
      }
    })
  }

  public checkTask: (db: Database) => Promise<boolean>
}
