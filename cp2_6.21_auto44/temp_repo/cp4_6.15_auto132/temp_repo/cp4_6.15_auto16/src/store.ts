import { create } from 'zustand';
import type { Task, FilterState, ModalState, Priority, TaskStatus } from './types';
import dayjs from 'dayjs';

const TEAM_MEMBERS = [
  { id: '1', name: '张伟' },
  { id: '2', name: '李娜' },
  { id: '3', name: '王强' },
  { id: '4', name: '刘洋' },
  { id: '5', name: '陈芳' },
];

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const createInitialTasks = (): Task[] => {
  const today = dayjs();
  return [
    {
      id: generateId(), name: '需求分析文档', assignee: '张伟', startDate: today.subtract(5, 'day').format('YYYY-MM-DD'),
      endDate: today.add(3, 'day').format('YYYY-MM-DD'), priority: 'high', progress: 75, status: 'in_progress',
      createdAt: today.subtract(10, 'day').toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: 'UI设计稿', assignee: '李娜', startDate: today.subtract(2, 'day').format('YYYY-MM-DD'),
      endDate: today.add(7, 'day').format('YYYY-MM-DD'), priority: 'medium', progress: 40, status: 'in_progress',
      createdAt: today.subtract(8, 'day').toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: '数据库设计', assignee: '王强', startDate: today.format('YYYY-MM-DD'),
      endDate: today.add(5, 'day').format('YYYY-MM-DD'), priority: 'high', progress: 20, status: 'in_progress',
      createdAt: today.subtract(5, 'day').toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: 'API接口开发', assignee: '刘洋', startDate: today.add(2, 'day').format('YYYY-MM-DD'),
      endDate: today.add(12, 'day').format('YYYY-MM-DD'), priority: 'high', progress: 0, status: 'not_started',
      createdAt: today.subtract(3, 'day').toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: '前端页面开发', assignee: '陈芳', startDate: today.add(5, 'day').format('YYYY-MM-DD'),
      endDate: today.add(18, 'day').format('YYYY-MM-DD'), priority: 'medium', progress: 0, status: 'not_started',
      createdAt: today.subtract(2, 'day').toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: '单元测试编写', assignee: '王强', startDate: today.add(10, 'day').format('YYYY-MM-DD'),
      endDate: today.add(16, 'day').format('YYYY-MM-DD'), priority: 'low', progress: 0, status: 'not_started',
      createdAt: today.subtract(1, 'day').toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: '项目环境搭建', assignee: '张伟', startDate: today.subtract(10, 'day').format('YYYY-MM-DD'),
      endDate: today.subtract(6, 'day').format('YYYY-MM-DD'), priority: 'high', progress: 100, status: 'completed',
      createdAt: today.subtract(15, 'day').toISOString(), updatedAt: today.subtract(6, 'day').toISOString(),
    },
    {
      id: generateId(), name: '技术选型评估', assignee: '刘洋', startDate: today.subtract(8, 'day').format('YYYY-MM-DD'),
      endDate: today.subtract(3, 'day').format('YYYY-MM-DD'), priority: 'medium', progress: 100, status: 'completed',
      createdAt: today.subtract(12, 'day').toISOString(), updatedAt: today.subtract(3, 'day').toISOString(),
    },
    {
      id: generateId(), name: '代码审查流程', assignee: '李娜', startDate: today.add(8, 'day').format('YYYY-MM-DD'),
      endDate: today.add(14, 'day').format('YYYY-MM-DD'), priority: 'low', progress: 0, status: 'not_started',
      createdAt: today.toISOString(), updatedAt: today.toISOString(),
    },
    {
      id: generateId(), name: '性能优化方案', assignee: '陈芳', startDate: today.add(12, 'day').format('YYYY-MM-DD'),
      endDate: today.add(20, 'day').format('YYYY-MM-DD'), priority: 'medium', progress: 0, status: 'not_started',
      createdAt: today.toISOString(), updatedAt: today.toISOString(),
    },
  ];
};

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

interface KanbanStore {
  tasks: Task[];
  filters: FilterState;
  zoomLevel: number;
  modalState: ModalState;
  deleteConfirm: { open: boolean; taskId: string | null };
  notification: { open: boolean; message: string; type: 'success' | 'error' | 'warning' };
  statsPanelOpen: boolean;
  filterBarCollapsed: boolean;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setZoomLevel: (level: number) => void;
  openModal: (mode: 'create' | 'edit', taskId?: string) => void;
  closeModal: () => void;
  openDeleteConfirm: (taskId: string) => void;
  closeDeleteConfirm: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  hideNotification: () => void;
  toggleStatsPanel: () => void;
  toggleFilterBar: () => void;
  exportTasks: () => string;
  importTasks: (json: string, strategy: 'overwrite' | 'skip') => { success: number; skipped: number; errors: number };
  getFilteredTasks: () => Task[];
}

export { TEAM_MEMBERS };

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  tasks: loadFromStorage('kanban-tasks', createInitialTasks()),
  filters: { assignees: [], priorities: [], status: 'all', keyword: '' },
  zoomLevel: 30,
  modalState: { open: false, mode: 'create', taskId: null },
  deleteConfirm: { open: false, taskId: null },
  notification: { open: false, message: '', type: 'success' },
  statsPanelOpen: false,
  filterBarCollapsed: false,

  addTask: (taskData) => {
    const now = new Date().toISOString();
    const progress = taskData.progress;
    const status: TaskStatus = progress === 0 ? 'not_started' : progress >= 100 ? 'completed' : 'in_progress';
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      progress,
      status,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const tasks = [...state.tasks, newTask];
      localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
      return { tasks };
    });
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
        if (updates.progress !== undefined) {
          updated.status = updates.progress === 0 ? 'not_started' : updates.progress >= 100 ? 'completed' : 'in_progress';
        }
        return updated;
      });
      localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
      return { tasks };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
      return { tasks, deleteConfirm: { open: false, taskId: null } };
    });
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setZoomLevel: (level) => {
    set({ zoomLevel: Math.max(7, Math.min(90, level)) });
  },

  openModal: (mode, taskId) => {
    set({ modalState: { open: true, mode, taskId: taskId ?? null } });
  },

  closeModal: () => {
    set({ modalState: { open: false, mode: 'create', taskId: null } });
  },

  openDeleteConfirm: (taskId) => {
    set({ deleteConfirm: { open: true, taskId } });
  },

  closeDeleteConfirm: () => {
    set({ deleteConfirm: { open: false, taskId: null } });
  },

  showNotification: (message, type) => {
    set({ notification: { open: true, message, type } });
    setTimeout(() => {
      get().hideNotification();
    }, 3000);
  },

  hideNotification: () => {
    set({ notification: { open: false, message: '', type: 'success' } });
  },

  toggleStatsPanel: () => {
    set((state) => ({ statsPanelOpen: !state.statsPanelOpen }));
  },

  toggleFilterBar: () => {
    set((state) => ({ filterBarCollapsed: !state.filterBarCollapsed }));
  },

  exportTasks: () => {
    const { tasks } = get();
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks }, null, 2);
  },

  importTasks: (json, strategy) => {
    try {
      const data = JSON.parse(json);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        get().showNotification('无效的JSON文件格式', 'error');
        return { success: 0, skipped: 0, errors: 1 };
      }
      let success = 0;
      let skipped = 0;
      const { tasks } = get();
      const existingIds = new Set(tasks.map((t) => t.id));

      const newTasks = data.tasks.filter((t: Task) => {
        if (!t.id || !t.name || !t.assignee) return false;
        if (existingIds.has(t.id)) {
          if (strategy === 'skip') {
            skipped++;
            return false;
          }
        }
        success++;
        return true;
      });

      set((state) => {
        let updated: Task[];
        if (strategy === 'overwrite') {
          const overwriteMap = new Map(newTasks.map((t: Task) => [t.id, t]));
          const merged = state.tasks.map((t) => overwriteMap.get(t.id) || t);
          const newOnly = newTasks.filter((t: Task) => !existingIds.has(t.id));
          updated = [...merged, ...newOnly];
        } else {
          updated = [...state.tasks, ...newTasks.filter((t: Task) => !existingIds.has(t.id))];
        }
        localStorage.setItem('kanban-tasks', JSON.stringify(updated));
        return { tasks: updated };
      });

      const msg = skipped > 0
        ? `导入完成：${success}个成功，${skipped}个跳过`
        : `导入完成：${success}个任务已导入`;
      get().showNotification(msg, 'success');
      return { success, skipped, errors: 0 };
    } catch {
      get().showNotification('JSON解析失败', 'error');
      return { success: 0, skipped: 0, errors: 1 };
    }
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks.filter((task) => {
      if (filters.assignees.length > 0 && !filters.assignees.includes(task.assignee)) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (!task.name.toLowerCase().includes(kw) && !task.assignee.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  },
}));
