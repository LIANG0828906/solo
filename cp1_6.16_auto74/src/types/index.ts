export interface User {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  lastActive?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  createdAt: string;
  creatorId: string;
  memberCount: number;
  members: string[];
}

export type TaskStatus = 'pending' | 'in-progress' | 'reviewing' | 'completed';

export type GroupingMethod = 'random' | 'manual';

export interface Task {
  id: string;
  classId: string;
  name: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  groupingMethod: GroupingMethod;
  groups: Group[];
}

export interface Group {
  id: string;
  taskId: string;
  name: string;
  memberIds: string[];
  leaderId: string;
  submission?: Submission;
  reviews: Review[];
}

export interface Submission {
  id: string;
  groupId: string;
  submittedAt: string;
  files: FileItem[];
}

export type FileType = 'image' | 'pdf' | 'document';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  url?: string;
  size?: number;
  pageCount?: number;
}

export interface Review {
  id: string;
  taskId: string;
  reviewerGroupId: string;
  revieweeGroupId: string;
  completeness: number;
  creativity: number;
  collaboration: number;
  comment: string;
  completed: boolean;
}

export interface GroupScore {
  groupId: string;
  groupName: string;
  avgCompleteness: number;
  avgCreativity: number;
  avgCollaboration: number;
  avgTotal: number;
  comments: string[];
}
