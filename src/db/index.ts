import dotenv from 'dotenv'
import { Kysely, Migrator, MysqlDialect, PostgresDialect } from 'kysely'
import { createPool } from 'mysql2'
import { DatabaseSchema } from './schema'
import { migrationProvider } from './migrations'
import { Pool } from 'pg'
import path from 'path'

const envPath = path.resolve(__dirname, '../../.env.local')
dotenv.config({ path: envPath })

export const createDb = async (): Promise<Database> => {
  if (process.env.PG_DATABASE) {
    const pg_dialect = new PostgresDialect({
      pool: new Pool({
        database: process.env.PG_DATABASE,
        user: process.env.PG_USER,
        password: process.env.PG_PASS,
        host: process.env.PG_HOST,
      }),
    })
    return new Kysely<DatabaseSchema>({
      dialect: pg_dialect,
    })
  } else {
    const dialect = new MysqlDialect({
      pool: createPool(process.env.DATABASE_URL ?? ''),
    })
    return new Kysely<DatabaseSchema>({
      dialect,
    })
  }
}

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider })
  const { error } = await migrator.migrateToLatest()
  if (error) throw error
}

export type Database = Kysely<DatabaseSchema>
