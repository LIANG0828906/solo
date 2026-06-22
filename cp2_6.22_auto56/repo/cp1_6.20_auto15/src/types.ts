export interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  startLine: number;
  endLine: number;
  author: string;
  content: string;
  createdAt: Date;
  replies: Reply[];
  isExpanded: boolean;
}

export interface Selection {
  startLine: number;
  endLine: number;
  isActive: boolean;
}

export type Language = 'javascript' | 'python' | 'plaintext';
