export interface FileChange {
  filename: string;
  additions: number;
  deletions: number;
}

export interface CommitData {
  sha: string;
  author: string;
  date: string;
  message: string;
  files: FileChange[];
  additions: number;
  deletions: number;
}

export interface RunResponse {
  success: boolean;
  data?: {
    id: string;
    repoPath: string;
    commits: CommitData[];
    totalCommits: number;
    updatedAt: string;
  };
  error?: string;
}

export interface BadgeWinner {
  author: string;
  fileCount: number;
  additions: number;
  commits: CommitData[];
}

export interface HighlightState {
  date: string | null;
  author: string | null;
}
