export interface User {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: string;
  assignee: string;
  createdAt: string;
  dueDate: string;
}
