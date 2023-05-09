import { CreateSchemaNode } from '../operation-node/create-schema-node.js';
import { OperationNodeSource } from '../operation-node/operation-node-source.js';
import { CompiledQuery } from '../query-compiler/compiled-query.js';
import { Compilable } from '../util/compilable.js';
import { QueryExecutor } from '../query-executor/query-executor.js';
import { QueryId } from '../util/query-id.js';
export declare class CreateSchemaBuilder implements OperationNodeSource, Compilable {
    #private;
    constructor(props: CreateSchemaBuilderProps);
    ifNotExists(): CreateSchemaBuilder;
    toOperationNode(): CreateSchemaNode;
    compile(): CompiledQuery;
    execute(): Promise<void>;
}
export interface CreateSchemaBuilderProps {
    readonly queryId: QueryId;
    readonly executor: QueryExecutor;
    readonly createSchemaNode: CreateSchemaNode;
}
