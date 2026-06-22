export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface TeamMember {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  projectId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  operatorId: string;
  operatorName: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  createdAt: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': '待办',
  'in-progress': '进行中',
  'done': '已完成',
};

export interface TaskStore {
  projects: Project[];
  tasks: Task[];
  members: TeamMember[];
  activityLogs: ActivityLog[];
  currentProjectId: string | null;
  searchQuery: string;
  filterPriority: Priority | 'all';

  addProject: (name: string) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;

  setSearchQuery: (query: string) => void;
  setFilterPriority: (priority: Priority | 'all') => void;

  loadFromStorage: () => void;
}

export interface MemberStats {
  memberId: string;
  memberName: string;
  total: number;
  completed: number;
}

export interface ProjectStats {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
  memberStats: MemberStats[];
}
