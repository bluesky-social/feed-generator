import { BskyAgent } from '@atproto/api'
import {
  addListMembers,
  getListMembers,
  removeListMembers,
} from '../listMethods.js'
import { ITask } from './task.js'

export class AuthorTask implements ITask {
  private periodicIntervalId: NodeJS.Timer | undefined
  private AuthorsToAdd: string[] = []
  private AuthorsToRemove: string[] = []
  private authorUriMap: any[] = []

  public Authors: string[] = []

  public run = (interval: number, agent: BskyAgent) => {
    const timer = async () => {
      try {
        console.log('Authors Task: running now')
        // Add Authors
        await this.addAuthorsToList(agent)
        // Remove Authors
        await this.removeAuthors(agent)
        // Get Authors
        const { members, uriMap } = await this.getAuthors(agent)
        this.Authors = members
        this.authorUriMap = uriMap
      } catch (e) {
        console.log(`Authors Task: error running periodic task - ${e.message}`)
      }
    }

    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(timer, interval)

      // Call timer on the initial run
      timer()
    }
  }

  public addAuthor = (author: string): boolean => {
    if (this.AuthorsToAdd.includes(author)) return false
    if (this.Authors.includes(author)) return false
    console.log('Author: adding author = ', author)
    this.AuthorsToAdd.push(author)
    return true
  }

  public removeAuthor = (author: string) => {
    if (this.AuthorsToRemove.includes(author)) return
    if (!this.Authors.includes(author)) return
    console.log('Author: removing author = ', author)
    this.AuthorsToRemove.push(author)
  }

  private getAuthors = async (
    agent: BskyAgent,
  ): Promise<{ members: string[]; uriMap: any[] }> => {
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

    await Promise.all(
      this.AuthorsToRemove.map(async (author, index) => {
        await removeListMembers(this.authorUriMap[author], agent)
        this.AuthorsToRemove.splice(index, 1)

        const indexToRemove = this.Authors.indexOf(author)

        if (indexToRemove > -1) {
          this.Authors.splice(indexToRemove, 1)
          delete this.authorUriMap[author]
        }
      }),
    )
  }
}
