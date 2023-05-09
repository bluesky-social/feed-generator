import { CheckConstraintNode } from './check-constraint-node.js';
import { ForeignKeyConstraintNode } from './foreign-key-constraint-node.js';
import { PrimaryKeyConstraintNode } from './primary-constraint-node.js';
import { UniqueConstraintNode } from './unique-constraint-node.js';
export declare type ConstraintNode = PrimaryKeyConstraintNode | UniqueConstraintNode | CheckConstraintNode | ForeignKeyConstraintNode;
