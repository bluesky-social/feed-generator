import { Kysely, SqliteDialect } from 'kysely'
import SqliteDb from 'better-sqlite3'

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  })
}

export type Database = Kysely<DatabaseSchema>

export type PostTable = {
  uri: string
  cid: string
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
}

export type SubStateTable = {
  service: string
  cursor: number
}

export type DatabaseSchema = {
  posts: PostTable
  sub_state: SubStateTable
}
