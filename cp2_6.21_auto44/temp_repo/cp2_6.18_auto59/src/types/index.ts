export type Priority = 'P0' | 'P1' | 'P2';

export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export type EstimatedMinutes = 15 | 30 | 45 | 60;

export type TemplateType = 'simple' | 'detailed' | 'custom';

export interface CustomTemplateSection {
  key: 'title' | 'completedTasks' | 'pendingTasks' | 'workHours' | 'notes';
  title: string;
  enabled: boolean;
  order: number;
}

export interface CustomTemplateConfig {
  sections: CustomTemplateSection[];
}

export interface Task {
  id: string;
  content: string;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: EstimatedMinutes;
  createdAt: number;
  completedAt?: number;
  order: number;
}

export interface DayBriefStore {
  tasks: Task[];
  draftNotes: string;
  templateType: TemplateType;
  customTemplate: CustomTemplateConfig;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskStatus: (id: string) => void;
  reorderTasks: (fromId: string, toId: string, scope: 'all' | 'completed' | 'pending') => void;
  updateDraftNotes: (notes: string) => void;
  setTemplateType: (type: TemplateType) => void;
  updateCustomTemplate: (config: Partial<CustomTemplateConfig>) => void;

  getPendingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTotalCompletedMinutes: () => number;
}

export interface DragItemData {
  id: string;
  scope: 'pending' | 'completed';
}
