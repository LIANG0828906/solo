export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: string[];
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  date: string;
}

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
}
