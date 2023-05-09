/// <reference types="./data-type-node.d.ts" />
import { freeze } from '../util/object-utils.js';
/**
 * @internal
 */
export const DataTypeNode = freeze({
    is(node) {
        return node.kind === 'DataTypeNode';
    },
    create(dataType) {
        return freeze({
            kind: 'DataTypeNode',
            dataType,
        });
    },
});
