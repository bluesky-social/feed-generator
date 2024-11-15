import { Database } from '../db'

export type Author = {
  did: string
}

export class AuthorTask {
  private periodicIntervalId: NodeJS.Timer | undefined
  public Authors: Author[]

  public run = (db: Database) => {
    console.log('Run called')
    if (!this.periodicIntervalId) {
      this.periodicIntervalId = setInterval(async () => {
        console.log(`Authors: running 2m task`)
        try {
          this.Authors = await this.runAuthorTask(db)
        } catch (e) {
          console.log(`Authors: error running periodic task ${e.message}`)
        }
      }, 30 * 1000)
    }
  }

  private runAuthorTask = async (db: Database): Promise<Author[]> => {
    let builder = db.selectFrom('author').selectAll()

    const res = await builder.execute()

    const authors: Author[] = res.map((row) => {
      return { did: row.did }
    })

    return authors
  }
}
