export type ImportType = 'internal' | 'external' | 'namespace';

export interface ImportInfo {
  path: string;
  resolvedPath?: string;
  type: ImportType;
  named: string[];
  default?: string;
}

export interface FileNode {
  id: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  imports: ImportInfo[];
  importedBy: string[];
  name: string;
  parentId?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface DepEdge {
  id: string;
  source: string;
  target: string;
  type: ImportType;
}

export interface DepGraph {
  nodes: FileNode[];
  edges: DepEdge[];
  cycles: string[][];
  rootPath: string;
}

export type TreeNode = FileNode & { expanded?: boolean };
