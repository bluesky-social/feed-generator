"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyDriver = void 0;
/**
 * A driver that does absolutely nothing.
 *
 * You can use this to create Kysely instances solely for building queries
 *
 * ### Examples
 *
 * This example creates a Kysely instance for building postgres queries:
 *
 * ```ts
 * const db = new Kysely<Database>({
 *   dialect: {
 *     createAdapter() {
 *       return new PostgresAdapter()
 *     },
 *     createDriver() {
 *       return new DummyDriver()
 *     },
 *     createIntrospector(db: Kysely<any>) {
 *       return new PostgresIntrospector(db)
 *     },
 *     createQueryCompiler() {
 *       return new PostgresQueryCompiler()
 *     },
 *   },
 * })
 * ```
 *
 * You can use it to build a query and compile it to SQL but trying to
 * execute the query will throw an error.
 *
 * ```ts
 * const { sql } = db.selectFrom('person').selectAll().compile()
 * console.log(sql) // select * from "person"
 * ```
 */
class DummyDriver {
    async init() {
        // Nothing to do here.
    }
    async acquireConnection() {
        return new DummyConnection();
    }
    async beginTransaction() {
        // Nothing to do here.
    }
    async commitTransaction() {
        // Nothing to do here.
    }
    async rollbackTransaction() {
        // Nothing to do here.
    }
    async releaseConnection() {
        // Nothing to do here.
    }
    async destroy() {
        // Nothing to do here.
    }
}
exports.DummyDriver = DummyDriver;
class DummyConnection {
    async executeQuery() {
        return {
            rows: [],
        };
    }
    async *streamQuery() {
        // Nothing to do here.
    }
}
