export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatar: string;
  tasks: Task[];
}
