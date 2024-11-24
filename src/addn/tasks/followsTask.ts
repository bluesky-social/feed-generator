import { AtpSessionData, BskyAgent } from '@atproto/api'
import { ITask } from './task.js'
import { Database } from '../../db/index.js'
import { getListMembers } from '../listMethods.js'

export class FollowsTask implements ITask {
  public name = 'follows'
  private periodicIntervalId: NodeJS.Timer | undefined
  public newFollowers: any[] = []

  public run = (interval: number, agent: BskyAgent, db: Database) => {
    const timer = async () => {
      try {
        if (this.newFollowers.length > 0) {
          const uri = await this.followNewMember(
            db,
            agent,
            this.newFollowers.shift(),
          )
          console.log(`Followers Task: followed - `, uri)
        }
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

  public follow = (author: string) => {
    if (this.newFollowers.includes(author)) return false
    this.newFollowers.push(author)
  }

  public async followNewMember(
    db: Database,
    agent: BskyAgent,
    member: string,
  ): Promise<string> {
    const { uri } = await agent.follow(member)

    return uri
  }

  public checkTask: (db: Database) => Promise<boolean>
}
