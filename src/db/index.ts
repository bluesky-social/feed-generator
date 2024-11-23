import dotenv from 'dotenv'
import { Kysely, Migrator, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import { DatabaseSchema } from './schema'
import { migrationProvider } from './migrations'
import path from 'path'

const envPath = path.resolve(__dirname, '../../.env.local')
dotenv.config({ path: envPath })

const dialect = new MysqlDialect({
  pool: createPool(process.env.DATABASE_URL ?? ''),
})

export const createDb = async (): Promise<Database> => {
  return new Kysely<DatabaseSchema>({
    dialect,
  })
}

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider })
  const { error } = await migrator.migrateToLatest()
  if (error) throw error
}

export type Database = Kysely<DatabaseSchema>
