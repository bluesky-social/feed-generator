import { Database } from '../db'

export type Author = {
  did: string
}

export class AuthorTask {
  private periodicIntervalId: NodeJS.Timer | undefined
  private AuthorsToAdd: string[] = []

  public Authors: string[]

  public run = (db: Database) => {
    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(async () => {
        try {
          // Add Authors
          this.addAuthors(db)
          // Get Authors
          this.Authors = await this.getAuthors(db)
        } catch (e) {
          console.log(`Authors: error running periodic task ${e.message}`)
        }
      }, 10 * 1000)
    }
  }

  public addAuthor = (author: string) => {
    if (this.AuthorsToAdd.includes(author)) return
    if (this.Authors.includes(author)) return
    this.AuthorsToAdd.push(author)
  }

  private getAuthors = async (db: Database): Promise<string[]> => {
    let builder = db.selectFrom('author').selectAll()

    const res = await builder.execute()

    const authors: string[] = res.map((row) => {
      return row.did
    })

    return authors
  }

  private addAuthors = async (db: Database) => {
    if (this.AuthorsToAdd?.length === 0) return

    let authors = this.AuthorsToAdd.map((author) => {
      return { did: author }
    })

    await db.insertInto('author').values(authors).execute()
    this.AuthorsToAdd = []
  }
}
