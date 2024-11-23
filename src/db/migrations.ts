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
      .addColumn('uri', 'varchar(255)', (col) => col.primaryKey())
      .addColumn('cid', 'varchar(255)', (col) => col.notNull())
      .addColumn('replyParent', 'varchar(255)')
      .addColumn('replyRoot', 'varchar(255)')
      .addColumn('indexedAt', 'varchar(255)', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('sub_state')
      .addColumn('service', 'varchar(255)', (col) => col.primaryKey())
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
      .addColumn('tag', 'varchar(255)', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.alterTable('post').dropColumn('tag').execute()
  },
}

migrations['003'] = {
  async up(db: Kysely<unknown>) {
    await db.schema.alterTable('post').dropColumn('tag').execute()
    await db.schema
      .createTable('post_tag')
      .addColumn('post_uri', 'varchar(255)', (col) =>
        col.references('post.uri').onDelete('no action').notNull(),
      )
      .addColumn('tag', 'varchar(255)', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar(255)', (col) => col.notNull())
      .execute()
    await db.schema
      .createIndex('post_tag_id_index')
      .on('post_tag')
      .column('post_uri')
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema
      .alterTable('post')
      .addColumn('tag', 'varchar(255)', (col) => col.notNull())
      .execute()
    await db.schema.dropTable('post_tag').execute()
  },
}

migrations['004'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .alterTable('post_tag')
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.alterTable('post_tag').dropColumn('id').execute()
  },
}
