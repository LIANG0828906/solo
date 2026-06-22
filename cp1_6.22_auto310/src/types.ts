export interface Repo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  openIssuesCount: number;
  color: string;
}

export type LabelName = 'bug' | 'enhancement' | 'documentation' | 'help wanted';

export interface IssueLabel {
  name: LabelName;
  color: string;
}

export interface Issue {
  id: string;
  repoId: string;
  number: number;
  title: string;
  description: string;
  createdAt: string;
  labels: IssueLabel[];
  commentsCount: number;
  isOpen: boolean;
}

export type PRStatus = 'unreviewed' | 'changes_requested' | 'ready_to_merge' | 'merged';

export interface PullRequest {
  id: string;
  repoId: string;
  number: number;
  title: string;
  author: string;
  status: PRStatus;
  createdAt: string;
  mergedAt?: string;
  linesAdded: number;
  linesDeleted: number;
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  mergedPRs: number;
  closedIssues: number;
  newComments: number;
  totalLinesAdded: number;
  reposBreakdown: { repoName: string; mergedPRs: number; linesAdded: number }[];
}

export const LABEL_COLORS: Record<LabelName, string> = {
  bug: '#e74c3c',
  enhancement: '#2ecc71',
  documentation: '#3498db',
  'help wanted': '#9b59b6',
};

export const PR_STATUS_META: Record<Exclude<PRStatus, 'merged'>, { label: string; color: string }> = {
  unreviewed: { label: '未审查', color: '#f39c12' },
  changes_requested: { label: '需要修改', color: '#f1c40f' },
  ready_to_merge: { label: '准备合并', color: '#3498db' },
};
