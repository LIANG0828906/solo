export interface BaseEntity {
  id: string;
  createdAt: string;
}

export interface Article extends BaseEntity {
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  articleRef: string | null;
}

export interface Bookmark extends BaseEntity {
  title: string;
  url: string;
  favicon: string;
  group: string;
}

export interface CrossModuleReference {
  type: 'task';
  id: string;
  title: string;
}

export interface SearchResult {
  module: 'article' | 'task' | 'bookmark';
  id: string;
  title: string;
  excerpt: string;
}
