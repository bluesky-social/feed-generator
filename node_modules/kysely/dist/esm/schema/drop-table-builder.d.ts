import { DropTableNode } from '../operation-node/drop-table-node.js';
import { OperationNodeSource } from '../operation-node/operation-node-source.js';
import { CompiledQuery } from '../query-compiler/compiled-query.js';
import { Compilable } from '../util/compilable.js';
import { QueryExecutor } from '../query-executor/query-executor.js';
import { QueryId } from '../util/query-id.js';
export declare class DropTableBuilder implements OperationNodeSource, Compilable {
    #private;
    constructor(props: DropTableBuilderProps);
    ifExists(): DropTableBuilder;
    cascade(): DropTableBuilder;
    toOperationNode(): DropTableNode;
    compile(): CompiledQuery;
    execute(): Promise<void>;
}
export interface DropTableBuilderProps {
    readonly queryId: QueryId;
    readonly executor: QueryExecutor;
    readonly dropTableNode: DropTableNode;
}
