import type { PlaceholderToken } from './types';
declare type FormatUnboundExpression = (subject: string, token: PlaceholderToken, boundValues: any[]) => string;
declare type Configuration = {
    formatUnboundExpression: FormatUnboundExpression;
};
declare type Printf = (subject: string, ...boundValues: any[]) => string;
export declare const createPrintf: (configuration?: Configuration | undefined) => Printf;
export {};
