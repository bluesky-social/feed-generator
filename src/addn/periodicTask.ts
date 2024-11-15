import { Database } from '../db'

export type Author = {
  did: string
}

export class AuthorTask {
  private periodicIntervalId: NodeJS.Timer | undefined
  private AuthorsToAdd: string[] = []
  private AuthorsToRemove: string[] = []

  public Authors: string[]

  public run = (db: Database) => {
    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(async () => {
        try {
          // Add Authors
          this.addAuthors(db)
          // Remove Authors
          this.removeAuthors(db)
          // Get Authors
          this.Authors = await this.getAuthors(db)
        } catch (e) {
          console.log(`Authors: error running periodic task ${e.message}`)
        }
      }, 20 * 1000)
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

  private removeAuthors = async (db: Database) => {
    if (this.AuthorsToRemove?.length === 0) return

    let author = this.AuthorsToRemove.filter((author) => {
      return author == this.AuthorsToRemove[0]
    })

    await db
      .deleteFrom('author')
      .where('author.did', '=', author)
      .executeTakeFirst()
    this.AuthorsToAdd = []
  }
}
