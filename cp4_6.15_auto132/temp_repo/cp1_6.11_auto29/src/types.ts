export type DiffOperation = 'insert' | 'delete' | 'equal';

export interface DiffChunk {
  id: string;
  operation: DiffOperation;
  value: string;
  accepted?: boolean;
}

export interface DiffResult {
  chunks: DiffChunk[];
}

export interface Version {
  id: string;
  content: string;
  timestamp: number;
  label: string;
}

export interface DiffRequest {
  oldText: string;
  newText: string;
}
