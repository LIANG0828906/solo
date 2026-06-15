export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  assignee: string;
}

export interface Column {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
}

export interface BoardData {
  boards: Board[];
}

export interface UpdateTaskRequest {
  task: Task;
  columnId: string;
  boardId: string;
  sourceColumnId?: string;
  targetColumnId?: string;
}

export interface BoardUpdateEvent {
  boardId: string;
  action: 'moved' | 'updated' | 'created' | 'deleted';
  task: Task;
  user: string;
  columnId: string;
  taskTitle: string;
}

export interface DragItem {
  type: 'TASK';
  task: Task;
  sourceColumnId: string;
  sourceIndex: number;
  boardId: string;
}
