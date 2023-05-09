import { CompiledQuery } from '../query-compiler/compiled-query.js';
import { ArrayItemType } from './type-utils.js';
export declare const LOG_LEVELS: readonly ["query", "error"];
export declare type LogLevel = ArrayItemType<typeof LOG_LEVELS>;
export interface QueryLogEvent {
    readonly level: 'query';
    readonly query: CompiledQuery;
    readonly queryDurationMillis: number;
}
export interface ErrorLogEvent {
    readonly level: 'error';
    readonly error: unknown;
}
export declare type LogEvent = QueryLogEvent | ErrorLogEvent;
export declare type Logger = (event: LogEvent) => void;
export declare type LogConfig = ReadonlyArray<LogLevel> | Logger;
export declare class Log {
    #private;
    constructor(config: LogConfig);
    isLevelEnabled(level: LogLevel): boolean;
    query(getEvent: () => QueryLogEvent): void;
    error(getEvent: () => ErrorLogEvent): void;
}
