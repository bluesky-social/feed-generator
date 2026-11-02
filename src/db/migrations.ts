import { Kysely, Migration, MigrationProvider } from 'kysely'

const migrations: Record<string, Migration> = {}

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('post')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('cid', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('sub_state')
      .addColumn('service', 'varchar', (col) => col.primaryKey())
      .addColumn('cursor', 'integer', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('post').execute()
    await db.schema.dropTable('sub_state').execute()
  },
}

migrations['002'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .alterTable('post')
      .addColumn('authorDid', 'varchar', (col) => col.notNull().defaultTo(''))
      .execute()
    await db.schema
      .alterTable('post')
      .addColumn('createdAt', 'varchar', (col) =>
        col.notNull().defaultTo('1970-01-01T00:00:00.000Z'),
      )
      .execute()
    await db.schema
      .alterTable('post')
      .addColumn('langsJson', 'varchar', (col) => col.notNull().defaultTo('[]'))
      .execute()
    await db.schema
      .alterTable('post')
      .addColumn('isPolitical', 'integer', (col) => col.notNull().defaultTo(0))
      .execute()
    await db.schema
      .alterTable('post')
      .addColumn('status', 'varchar', (col) => col.notNull().defaultTo('active'))
      .execute()

    await db.schema
      .createTable('app_user')
      .addColumn('did', 'varchar', (col) => col.primaryKey())
      .addColumn('handle', 'varchar')
      .addColumn('pds_url', 'varchar')
      .addColumn('first_seen_at', 'varchar')
      .addColumn('last_seen_at', 'varchar')
      .execute()

    await db.schema
      .createIndex('idx_post_feed')
      .on('post')
      .columns(['status', 'isPolitical', 'createdAt', 'uri'])
      .execute()
    await db.schema
      .createIndex('idx_post_author')
      .on('post')
      .columns(['authorDid', 'status', 'createdAt', 'uri'])
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropIndex('idx_post_author').execute()
    await db.schema.dropIndex('idx_post_feed').execute()
    await db.schema.dropTable('app_user').execute()
    await db.schema
      .alterTable('post')
      .dropColumn('authorDid')
      .dropColumn('createdAt')
      .dropColumn('langsJson')
      .dropColumn('isPolitical')
      .dropColumn('status')
      .execute()
  },
}
