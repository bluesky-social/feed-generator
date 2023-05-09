import { DeleteQueryNode } from '../../operation-node/delete-query-node.js';
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js';
import { SelectQueryNode } from '../../operation-node/select-query-node.js';
import { UpdateQueryNode } from '../../operation-node/update-query-node.js';
export declare class DeduplicateJoinsTransformer extends OperationNodeTransformer {
    #private;
    protected transformSelectQuery(node: SelectQueryNode): SelectQueryNode;
    protected transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode;
    protected transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode;
}
