import { OperationNode } from './operation-node.js';
export declare type ColumnDataType = 'varchar' | `varchar(${number})` | 'text' | 'integer' | 'int2' | 'int4' | 'int8' | 'bigint' | 'boolean' | 'real' | 'double precision' | 'float4' | 'float8' | 'decimal' | `decimal(${number}, ${number})` | 'numeric' | `numeric(${number}, ${number})` | 'binary' | 'date' | 'datetime' | `datetime(${number})` | 'time' | `time(${number})` | 'timetz' | `timetz(${number})` | 'timestamp' | `timestamp(${number})` | 'timestamptz' | `timestamptz(${number})` | 'serial' | 'bigserial' | 'uuid' | 'json' | 'jsonb' | 'blob';
export declare type DataTypeParams = Omit<DataTypeNode, 'kind' | 'dataType'>;
export interface DataTypeNode extends OperationNode {
    readonly kind: 'DataTypeNode';
    readonly dataType: ColumnDataType;
}
/**
 * @internal
 */
export declare const DataTypeNode: Readonly<{
    is(node: OperationNode): node is DataTypeNode;
    create(dataType: ColumnDataType): DataTypeNode;
}>;
