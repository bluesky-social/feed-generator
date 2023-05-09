import { OperationNodeSource } from '../operation-node/operation-node-source.js';
import { CompiledQuery } from '../query-compiler/compiled-query.js';
import { Compilable } from '../util/compilable.js';
import { QueryExecutor } from '../query-executor/query-executor.js';
import { QueryId } from '../util/query-id.js';
import { DropViewNode } from '../operation-node/drop-view-node.js';
export declare class DropViewBuilder implements OperationNodeSource, Compilable {
    #private;
    constructor(props: DropViewBuilderProps);
    materialized(): DropViewBuilder;
    ifExists(): DropViewBuilder;
    cascade(): DropViewBuilder;
    toOperationNode(): DropViewNode;
    compile(): CompiledQuery;
    execute(): Promise<void>;
}
export interface DropViewBuilderProps {
    readonly queryId: QueryId;
    readonly executor: QueryExecutor;
    readonly dropViewNode: DropViewNode;
}
