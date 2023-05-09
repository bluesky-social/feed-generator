import { GroupByItemNode } from '../operation-node/group-by-item-node.js';
import { ReferenceExpression } from './reference-parser.js';
export declare type GroupByExpression<DB, TB extends keyof DB, O> = ReferenceExpression<DB, TB> | (keyof O & string);
export declare type GroupByExpressionOrList<DB, TB extends keyof DB, O> = ReadonlyArray<GroupByExpression<DB, TB, O>> | GroupByExpression<DB, TB, O>;
export declare function parseGroupBy(groupBy: GroupByExpressionOrList<any, any, any>): GroupByItemNode[];
