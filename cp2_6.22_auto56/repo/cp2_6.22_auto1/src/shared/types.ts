export interface IDocumentVersion {
  id: string;
  roomId: string;
  timestamp: number;
  author: string;
  snapshot: string;
  label?: string;
}

export interface ICursorInfo {
  userId: string;
  name: string;
  color: string;
  position: number;
  selectionFrom?: number;
  selectionTo?: number;
}

export interface IComment {
  id: string;
  roomId: string;
  from: number;
  to: number;
  text: string;
  author: string;
  authorColor: string;
  createdAt: number;
  parentId: string | null;
  resolved: boolean;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface ITask {
  id: string;
  roomId: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: number | null;
  order: number;
}

export interface IUserInfo {
  userId: string;
  name: string;
  color: string;
}

export interface IUserCursor extends ICursorInfo {
  headHeight: number;
  anchorHeight: number;
}
