export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroRecord {
  id: string;
  taskId: string;
  completedAt: string;
  duration: number;
}

export interface AppState {
  tasks: Task[];
  pomodoroRecords: PomodoroRecord[];
  activeTaskId: string | null;
  theme: 'light' | 'dark';
}

export type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Partial<Task> & { id: string } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus } }
  | { type: 'SET_ACTIVE_TASK'; payload: string | null }
  | { type: 'COMPLETE_POMODORO'; payload: PomodoroRecord }
  | { type: 'TOGGLE_THEME' };

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export const COLUMN_CONFIG: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: '待处理', color: '#3498db' },
  { status: 'in_progress', label: '进行中', color: '#f39c12' },
  { status: 'done', label: '已完成', color: '#27ae60' },
];

export const POMODORO_DURATION = 25 * 60 * 1000;
