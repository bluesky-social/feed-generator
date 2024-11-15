import { Database } from '../db'

export type Author = {
  did: string
}

export class AuthorTask {
  private periodicIntervalId: NodeJS.Timer | undefined
  private AuthorsToAdd: Author[] = []

  public Authors: Author[]

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
      }, 30 * 1000)
    }
  }

  public addAuthor = (author: Author) => {
    if (this.AuthorsToAdd.includes(author)) return
    this.AuthorsToAdd.push(author)
  }

  private getAuthors = async (db: Database): Promise<Author[]> => {
    let builder = db.selectFrom('author').selectAll()

    const res = await builder.execute()

    const authors: Author[] = res.map((row) => {
      return { did: row.did }
    })

    return authors
  }

  private addAuthors = async (db: Database) => {
    if (this.AuthorsToAdd?.length === 0) return

    await db.insertInto('author').values(this.AuthorsToAdd).execute()
    this.AuthorsToAdd = []
  }
}
