export interface Parameter {
  name: string;
  in: string;
  type: string;
  required: boolean;
  description: string;
  example: any;
}

export interface SchemaField {
  type: string;
  description: string;
  example: any;
  properties?: Record<string, SchemaField>;
  required?: string[];
  items?: SchemaField;
  enum?: any[];
  format?: string;
  $ref?: string;
}

export interface RequestBody {
  description: string;
  required: boolean;
  content: Record<string, {
    schema: SchemaField;
    example: any;
  }>;
}

export interface Response {
  description: string;
  content: Record<string, {
    schema: SchemaField;
    example: any;
  }>;
}

export interface ApiPath {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: Parameter[];
  requestBody: RequestBody | null;
  responses: Record<string, Response>;
}

export interface Tag {
  name: string;
  description: string;
}

export interface ApiInfo {
  title: string;
  description: string;
  version: string;
}

export interface ParsedDoc {
  id: string;
  filename: string;
  info: ApiInfo;
  tags: Tag[];
  paths: ApiPath[];
}

export type ViewType = 'welcome' | 'doc' | 'mock';
