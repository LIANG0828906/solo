import { create } from 'zustand';
import type { Task, Sprint, TeamMember, BurndownPoint } from '@/types';
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  fetchSprints,
  createSprint as apiCreateSprint,
  fetchTeamMembers,
} from '@/services/mockApi';

interface BurndownCacheKey {
  sprintId: string;
  assigneeId: string | null;
  tasksHash: string;
}

interface BurndownCacheEntry {
  key: BurndownCacheKey;
  data: BurndownPoint[];
  timestamp: number;
}

const burndownCache = new Map<string, BurndownCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

export const generateTasksHash = (tasks: Task[]): string => {
  return tasks
    .map(
      (t) =>
        `${t.id}-${t.assignee}-${t.status}-${t.estimate}-${t.assignmentHistory.length}`
    )
    .join('|');
};

export const getCacheKey = (sprintId: string, assigneeId: string | null): string => {
  return `${sprintId}-${assigneeId || 'all'}`;
};

export const getTaskAssigneeAtDate = (task: Task, targetDate: Date): string | null => {
  const targetTime = targetDate.getTime();
  let currentAssignee: string | null = task.assignmentHistory[0]?.assignee ?? null;

  for (const entry of task.assignmentHistory) {
    const entryTime = new Date(entry.date).getTime();
    if (entryTime <= targetTime) {
      currentAssignee = entry.assignee;
    } else {
      break;
    }
  }

  return currentAssignee;
};

export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

interface AppState {
  tasks: Task[];
  sprints: Sprint[];
  currentSprintId: string | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  selectedTaskId: string | null;
  isTaskModalOpen: boolean;

  loadInitialData: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'assignmentHistory'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  assignTaskToSprint: (taskId: string, sprintId: string | null) => Promise<Task>;
  addSprint: (sprint: Omit<Sprint, 'id'>) => Promise<Sprint>;
  setCurrentSprint: (id: string | null) => void;
  getSprintTasks: (sprintId: string) => Task[];
  getTasksBySprintId: (sprintId: string) => Task[];
  getBacklogTasks: () => Task[];
  getBurndownData: (sprintId: string, assigneeId?: string | null) => BurndownPoint[];
  openTaskModal: (taskId: string | null) => void;
  closeTaskModal: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  sprints: [],
  currentSprintId: null,
  teamMembers: [],
  isLoading: false,
  selectedTaskId: null,
  isTaskModalOpen: false,

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const [tasks, sprints, teamMembers] = await Promise.all([
        fetchTasks(),
        fetchSprints(),
        fetchTeamMembers(),
      ]);
      set({
        tasks,
        sprints,
        teamMembers,
        currentSprintId: sprints.length > 0 ? sprints[0].id : null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    const newTask = await apiCreateTask(task);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  updateTask: async (id, updates) => {
    const updatedTask = await apiUpdateTask(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));
    return updatedTask;
  },

  deleteTask: async (id) => {
    await apiDeleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  assignTaskToSprint: async (taskId, sprintId) => {
    const updatedTask = await apiUpdateTask(taskId, { sprintId });
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));
    return updatedTask;
  },

  addSprint: async (sprint) => {
    const newSprint = await apiCreateSprint(sprint);
    set((state) => ({ sprints: [...state.sprints, newSprint] }));
    return newSprint;
  },

  setCurrentSprint: (id) => {
    set({ currentSprintId: id });
  },

  getSprintTasks: (sprintId) => {
    return get().tasks.filter((t) => t.sprintId === sprintId);
  },

  getTasksBySprintId: (sprintId) => {
    return get().tasks.filter((t) => t.sprintId === sprintId);
  },

  getBacklogTasks: () => {
    return get().tasks.filter((t) => t.sprintId === null);
  },

  getBurndownData: (sprintId, assigneeId = null) => {
    const sprint = get().sprints.find((s) => s.id === sprintId);
    if (!sprint) return [];

    const allSprintTasks = get().getSprintTasks(sprintId);
    const tasksHash = generateTasksHash(allSprintTasks);
    const cacheKey = getCacheKey(sprintId, assigneeId);

    const cachedEntry = burndownCache.get(cacheKey);
    const now = Date.now();
    if (
      cachedEntry &&
      cachedEntry.key.tasksHash === tasksHash &&
      now - cachedEntry.timestamp < CACHE_TTL
    ) {
      return cachedEntry.data;
    }

    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const data: BurndownPoint[] = [];

    if (!assigneeId) {
      const totalEstimate = allSprintTasks.reduce((sum, t) => sum + t.estimate, 0);

      for (let i = 0; i <= days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateKey = formatDateKey(currentDate);

        const ideal = totalEstimate - (totalEstimate * i) / Math.max(days, 1);

        const doneEstimate = allSprintTasks
          .filter((t) => t.status === 'done')
          .reduce((sum, t) => sum + t.estimate, 0);
        const actual = Math.max(0, totalEstimate - doneEstimate);

        data.push({
          date: dateKey,
          ideal: Math.round(ideal * 10) / 10,
          actual: Math.round(actual * 10) / 10,
        });
      }
    } else {
      const taskDateOwnership: Map<string, Set<string>> = new Map();

      for (let i = 0; i <= days; i++) {
        const checkDate = new Date(start);
        checkDate.setDate(checkDate.getDate() + i);
        const dateKey = formatDateKey(checkDate);

        const ownedTasks = allSprintTasks.filter((task) => {
          const taskAssignee = getTaskAssigneeAtDate(task, checkDate);
          return taskAssignee === assigneeId;
        });

        taskDateOwnership.set(dateKey, new Set(ownedTasks.map((t) => t.id)));
      }

      for (let i = 0; i <= days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateKey = formatDateKey(currentDate);

        const ownedTaskIds = taskDateOwnership.get(dateKey) || new Set();
        const dayTotalEstimate = allSprintTasks
          .filter((t) => ownedTaskIds.has(t.id))
          .reduce((sum, t) => sum + t.estimate, 0);

        let ideal = 0;
        if (ownedTaskIds.size > 0) {
          const taskStartDays: Map<string, number> = new Map();
          for (let j = 0; j <= i; j++) {
            const pastDate = new Date(start);
            pastDate.setDate(pastDate.getDate() + j);
            const pastDateKey = formatDateKey(pastDate);
            const pastOwned = taskDateOwnership.get(pastDateKey) || new Set();
            for (const taskId of pastOwned) {
              if (!taskStartDays.has(taskId)) {
                taskStartDays.set(taskId, j);
              }
            }
          }

          let cumulativeIdeal = 0;
          for (const taskId of ownedTaskIds) {
            const task = allSprintTasks.find((t) => t.id === taskId);
            if (!task) continue;
            const startDay = taskStartDays.get(taskId) || 0;
            const daysOwned = i - startDay;
            const totalDaysOwned = days - startDay + 1;
            const burned = totalDaysOwned > 0 ? (task.estimate * daysOwned) / totalDaysOwned : 0;
            cumulativeIdeal += Math.max(0, task.estimate - burned);
          }
          ideal = cumulativeIdeal;
        }

        const dayTasks = allSprintTasks.filter((t) => ownedTaskIds.has(t.id));
        const doneEstimate = dayTasks
          .filter((t) => t.status === 'done')
          .reduce((sum, t) => sum + t.estimate, 0);
        const actual = Math.max(0, dayTotalEstimate - doneEstimate);

        data.push({
          date: dateKey,
          ideal: Math.round(ideal * 10) / 10,
          actual: Math.round(actual * 10) / 10,
        });
      }
    }

    burndownCache.set(cacheKey, {
      key: { sprintId, assigneeId, tasksHash },
      data,
      timestamp: now,
    });

    return data;
  },

  openTaskModal: (taskId) => {
    set({ selectedTaskId: taskId, isTaskModalOpen: true });
  },

  closeTaskModal: () => {
    set({ selectedTaskId: null, isTaskModalOpen: false });
  },
}));
