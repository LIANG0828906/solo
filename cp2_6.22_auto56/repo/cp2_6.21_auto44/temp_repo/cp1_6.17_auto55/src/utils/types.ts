export interface Branch {
  name: string;
  lastCommitTime: string;
  lastCommitTimestamp: number;
}

export type DiffLineType = 'added' | 'deleted' | 'modified' | 'unchanged';

export interface CharDiff {
  text: string;
  isDiff: boolean;
}

export interface DiffLine {
  type: DiffLineType;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  oldContent: string;
  newContent: string;
  charDiff?: {
    old: CharDiff[];
    new: CharDiff[];
  };
}

export type FileStatus = 'added' | 'modified' | 'deleted';

export interface FileDiff {
  id: string;
  filePath: string;
  fileName: string;
  directory: string;
  status: FileStatus;
  oldContent: string;
  newContent: string;
  diffLines: DiffLine[];
  additions: number;
  deletions: number;
}

export interface Annotation {
  id: string;
  fileId: string;
  filePath: string;
  lineNumber: number;
  content: string;
  timestamp: number;
  timeString: string;
}

export interface DiffStats {
  addedFiles: number;
  modifiedFiles: number;
  deletedFiles: number;
  totalDiffLines: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  fileDiff?: FileDiff;
  status?: FileStatus;
}
