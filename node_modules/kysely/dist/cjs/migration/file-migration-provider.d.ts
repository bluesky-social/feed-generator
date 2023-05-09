import { Migration, MigrationProvider } from './migrator.js';
/**
 * Reads all migrations from a folder in node.js.
 *
 * ### Examples
 *
 * ```ts
 * import { promises as fs } from 'fs'
 * import path from 'path'
 *
 * new FileMigrationProvider({
 *   fs,
 *   path,
 *   migrationFolder: 'path/to/migrations/folder'
 * })
 * ```
 */
export declare class FileMigrationProvider implements MigrationProvider {
    #private;
    constructor(props: FileMigrationProviderProps);
    /**
     * Returns all migrations, old and new.
     *
     * For example if you have your migrations in a folder as separate files,
     * you can use the {@link FileMigrationProvider} that implements this
     * method to return all migrations in a folder.
     *
     * The keys of the returned object are migration names and values are the
     * migrations. The order of the migrations is determined by the alphabetical
     * order of the migration names. The items in the object don't need to be
     * sorted, they are sorted by Kysely.
     */
    getMigrations(): Promise<Record<string, Migration>>;
}
export interface FileMigrationProviderFS {
    readdir(path: string): Promise<string[]>;
}
export interface FileMigrationProviderPath {
    join(...path: string[]): string;
}
export interface FileMigrationProviderProps {
    fs: FileMigrationProviderFS;
    path: FileMigrationProviderPath;
    migrationFolder: string;
}
