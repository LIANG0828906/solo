import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TimeEntry, LeaderboardEntry, DailyHours } from '@/utils/types';
import type { TaskStatus } from '@/utils/types';
import { getTasks, saveTasks, getTimeEntries, saveTimeEntries } from '@/utils/db';
import { getTodayString, getLast7Days } from '@/utils/time';

interface TaskState {
  tasks: Task[];
  timeEntries: TimeEntry[];
  isLoading: boolean;
  init: () => Promise<void>;
  createTask: (data: {
    title: string;
    description: string;
    estimatedHours: number;
    deadline: string;
    creatorId: string;
    creatorName: string;
  }) => Promise<Task>;
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'estimatedHours' | 'deadline'>>,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  claimTask: (taskId: string, userId: string, userName: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'date'>) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getTimeEntriesByTask: (taskId: string) => TimeEntry[];
  getTasksByUser: (userId: string) => Task[];
  getLeaderboard: () => LeaderboardEntry[];
  getUserDailyHours: (userId: string) => DailyHours[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  timeEntries: [],
  isLoading: true,

  init: async () => {
    set({ isLoading: true });
    try {
      const [tasks, timeEntries] = await Promise.all([
        getTasks(),
        getTimeEntries(),
      ]);
      set({ tasks, timeEntries, isLoading: false });
    } catch (error) {
      console.error('Failed to init task store:', error);
      set({ isLoading: false });
    }
  },

  createTask: async (data) => {
    const task: Task = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      estimatedHours: data.estimatedHours,
      deadline: data.deadline,
      status: 'pending',
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      totalHours: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const tasks = [...get().tasks, task];
    await saveTasks(tasks);
    set({ tasks });
    return task;
  },

  updateTask: async (id, updates) => {
    const tasks = get().tasks.map((task) =>
      task.id === id
        ? { ...task, ...updates, updatedAt: Date.now() }
        : task,
    );
    await saveTasks(tasks);
    set({ tasks });
  },

  deleteTask: async (id) => {
    const tasks = get().tasks.filter((task) => task.id !== id);
    const timeEntries = get().timeEntries.filter((e) => e.taskId !== id);
    await Promise.all([saveTasks(tasks), saveTimeEntries(timeEntries)]);
    set({ tasks, timeEntries });
  },

  claimTask: async (taskId, userId, userName) => {
    const tasks = get().tasks.map((task) =>
      task.id === taskId && task.status === 'pending'
        ? {
            ...task,
            status: 'in_progress' as TaskStatus,
            assigneeId: userId,
            assigneeName: userName,
            updatedAt: Date.now(),
          }
        : task,
    );
    await saveTasks(tasks);
    set({ tasks });
  },

  completeTask: async (taskId) => {
    const tasks = get().tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: 'completed' as TaskStatus,
            updatedAt: Date.now(),
          }
        : task,
    );
    await saveTasks(tasks);
    set({ tasks });
  },

  addTimeEntry: async (entry) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: uuidv4(),
      date: getTodayString(),
    };

    const timeEntries = [...get().timeEntries, newEntry];
    const tasks = get().tasks.map((task) =>
      task.id === entry.taskId
        ? {
            ...task,
            totalHours: task.totalHours + entry.duration,
            updatedAt: Date.now(),
          }
        : task,
    );

    await Promise.all([saveTimeEntries(timeEntries), saveTasks(tasks)]);
    set({ timeEntries, tasks });
  },

  getTaskById: (id) => {
    return get().tasks.find((task) => task.id === id);
  },

  getTimeEntriesByTask: (taskId) => {
    return get().timeEntries
      .filter((e) => e.taskId === taskId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  getTasksByUser: (userId) => {
    return get().tasks.filter(
      (task) => task.assigneeId === userId || task.creatorId === userId,
    );
  },

  getLeaderboard: () => {
    const { tasks, timeEntries } = get();
    const userMap = new Map<string, { name: string; totalHours: number; completedTasks: Set<string> }>();

    for (const entry of timeEntries) {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          name: entry.userName,
          totalHours: 0,
          completedTasks: new Set(),
        });
      }
      const userData = userMap.get(entry.userId)!;
      userData.totalHours += entry.duration;
    }

    for (const task of tasks) {
      if (task.status === 'completed' && task.assigneeId) {
        if (!userMap.has(task.assigneeId)) {
          userMap.set(task.assigneeId, {
            name: task.assigneeName || '',
            totalHours: 0,
            completedTasks: new Set(),
          });
        }
        userMap.get(task.assigneeId)!.completedTasks.add(task.id);
      }
    }

    const entries: LeaderboardEntry[] = Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        totalHours: data.totalHours,
        completedTasks: data.completedTasks.size,
        rank: 0,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries;
  },

  getUserDailyHours: (userId) => {
    const last7Days = getLast7Days();
    const dailyMap = new Map<string, number>();

    for (const day of last7Days) {
      dailyMap.set(day, 0);
    }

    for (const entry of get().timeEntries) {
      if (entry.userId === userId && dailyMap.has(entry.date)) {
        dailyMap.set(entry.date, dailyMap.get(entry.date)! + entry.duration);
      }
    }

    return last7Days.map((date) => ({
      date,
      hours: dailyMap.get(date) || 0,
    }));
  },
}));
