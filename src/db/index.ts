import SqliteDb from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { Migrator } from 'kysely/migration'
import { migrationProvider } from './migrations.js'
import type { DatabaseSchema } from './schema.js'

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  })
}

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider })
  const { error } = await migrator.migrateToLatest()
  if (error) throw error
}

export type Database = Kysely<DatabaseSchema>
