export interface JSONSchema {
  title?: string;
  type?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  required?: string[];
  [key: string]: unknown;
}

export type DiffType = 'add' | 'remove' | 'modify';

export interface DiffResult {
  type: DiffType;
  path: string[];
  oldValue?: unknown;
  newValue?: unknown;
}

export interface SchemaFile {
  id: string;
  name: string;
  schema: JSONSchema;
}

export type SchemaNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'unknown';

export const TYPE_COLORS: Record<SchemaNodeType, string> = {
  object: '#3b82f6',
  array: '#8b5cf6',
  string: '#10b981',
  number: '#f59e0b',
  boolean: '#ef4444',
  null: '#6b7280',
  unknown: '#6b7280',
};

export function getSchemaType(schema: JSONSchema): SchemaNodeType {
  const type = schema.type;
  if (type === 'object' || schema.properties) return 'object';
  if (type === 'array' || schema.items) return 'array';
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'null') return 'null';
  return 'unknown';
}

export function hasChildren(schema: JSONSchema): boolean {
  const type = getSchemaType(schema);
  if (type === 'object' && schema.properties) {
    return Object.keys(schema.properties).length > 0;
  }
  if (type === 'array' && schema.items) {
    return true;
  }
  return false;
}
