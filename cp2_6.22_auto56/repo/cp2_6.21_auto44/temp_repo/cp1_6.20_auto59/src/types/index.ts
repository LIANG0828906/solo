export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lastEditor: User;
  versions: number;
}

export interface Version {
  id: string;
  version: number;
  content: string;
  editor: User;
  createdAt: string;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  lineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  leftLines: number;
  rightLines: number;
}

export type SortMode = 'updatedAt' | 'createdAt' | 'title';
