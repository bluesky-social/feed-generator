/// <reference types="./primary-constraint-node.d.ts" />
import { freeze } from '../util/object-utils.js';
import { ColumnNode } from './column-node.js';
import { IdentifierNode } from './identifier-node.js';
/**
 * @internal
 */
export const PrimaryConstraintNode = freeze({
    is(node) {
        return node.kind === 'PrimaryKeyConstraintNode';
    },
    create(columns, constraintName) {
        return freeze({
            kind: 'PrimaryKeyConstraintNode',
            columns: freeze(columns.map(ColumnNode.create)),
            name: constraintName ? IdentifierNode.create(constraintName) : undefined,
        });
    },
});
