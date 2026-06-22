export type TaskStatus = 'todo' | 'inProgress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  createdAt: string;
}

export interface BoardWithTasks extends Board {
  tasks: Task[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: TaskPriority;
  dueDate?: string;
  status?: TaskStatus;
}
