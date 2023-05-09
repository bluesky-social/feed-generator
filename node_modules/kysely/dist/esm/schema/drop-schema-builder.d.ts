import { DropSchemaNode } from '../operation-node/drop-schema-node.js';
import { OperationNodeSource } from '../operation-node/operation-node-source.js';
import { CompiledQuery } from '../query-compiler/compiled-query.js';
import { Compilable } from '../util/compilable.js';
import { QueryExecutor } from '../query-executor/query-executor.js';
import { QueryId } from '../util/query-id.js';
export declare class DropSchemaBuilder implements OperationNodeSource, Compilable {
    #private;
    constructor(props: DropSchemaBuilderProps);
    ifExists(): DropSchemaBuilder;
    cascade(): DropSchemaBuilder;
    toOperationNode(): DropSchemaNode;
    compile(): CompiledQuery;
    execute(): Promise<void>;
}
export interface DropSchemaBuilderProps {
    readonly queryId: QueryId;
    readonly executor: QueryExecutor;
    readonly dropSchemaNode: DropSchemaNode;
}
