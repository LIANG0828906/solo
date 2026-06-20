export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface Task {
  id: string;
  cardId: string;
  title: string;
  assignee: string;
  estimatedHours: number;
  dueDate: string;
  startDate: string;
  status: TaskStatus;
  order: number;
  dependencies: string[];
}
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': '待办',
  'in-progress': '进行中',
  'done': '已完成',
};
