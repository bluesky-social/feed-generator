import { BskyAgent } from '@atproto/api'
import { addListMembers, getListMembers } from '../listMethods.js'
import { ITask } from './task.js'

export class AuthorTask implements ITask {
  private periodicIntervalId: NodeJS.Timer | undefined
  private AuthorsToAdd: string[] = []
  private AuthorsToRemove: string[] = []

  public Authors: string[]

  public run = (interval: number, agent: BskyAgent) => {
    const timer = async () => {
      try {
        // Add Authors
        await this.addAuthorsToList(agent)
        // Remove Authors
        this.removeAuthors(agent)
        // Get Authors
        this.Authors = await this.getAuthors(agent)
      } catch (e) {
        console.log(`Authors: error running periodic task - ${e.message}`)
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  public addAuthor = (author: string) => {
    if (this.AuthorsToAdd.includes(author)) return
    if (this.Authors.includes(author)) return
    this.AuthorsToAdd.push(author)
  }

  public removeAuthor = (author: string) => {
    if (this.AuthorsToRemove.includes(author)) return
    if (!this.Authors.includes(author)) return
    this.AuthorsToRemove.push(author)
  }

  private getAuthors = async (agent: BskyAgent): Promise<string[]> => {
    // Get authors from BeyHive feed list
    const list: string = `${process.env.BEYHIVE_FEED_LIST}`
    return await getListMembers(list, agent)
  }

  private addAuthorsToList = async (agent: BskyAgent) => {
    if (this.AuthorsToAdd?.length === 0) return
    const list: string = `${process.env.BEYHIVE_FEED_LIST}`

    await Promise.all(
      this.AuthorsToAdd.map(async (author, index) => {
        await addListMembers(list, agent, author)
        this.AuthorsToAdd.splice(index, 1)
      }),
    )
  }

  private removeAuthors = async (agent: BskyAgent) => {
    if (this.AuthorsToRemove?.length === 0) return

    const list: string = `${process.env.BEYHIVE_FEED_LIST}`

    await Promise.all(
      this.AuthorsToRemove.map(async (author, index) => {
        await addListMembers(list, agent, author)
        this.AuthorsToRemove.splice(index, 1)

        const indexToRemove = this.Authors.indexOf(author)

        if (indexToRemove > -1) {
          this.Authors.splice(indexToRemove, 1)
        }
      }),
    )
  }
}
