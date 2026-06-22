import { create } from 'zustand';
import { addDays, differenceInDays, isBefore, isAfter, parseISO, isSameDay, startOfDay } from 'date-fns';
import {
  Project,
  Task,
  Resource,
  ResourceCalendar,
  ViewMode,
  DragState,
  DependencyConflict,
} from './types';

interface AppState {
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
  resourceCalendars: ResourceCalendar[];
  currentProjectId: string | null;
  viewMode: ViewMode;
  dragState: DragState;
  criticalPath: string[];
  dependencyConflicts: DependencyConflict[];
  pendingDependency: { fromId: string; toId: string } | null;
  isLoading: boolean;

  setCurrentProject: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setDragState: (state: DragState) => void;
  setPendingDependency: (dep: { fromId: string; toId: string } | null) => void;

  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  addDependency: (taskId: string, dependentId: string) => boolean;
  removeDependency: (taskId: string, dependentId: string) => void;

  addResource: (resource: Omit<Resource, 'id'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;

  calculateCriticalPath: () => void;
  checkDependencyConflicts: () => void;
  detectCycle: (taskId: string, dependentId: string) => boolean;
  getResourceLoad: (resourceId: string, date: string | Date) => number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const PROJECT_COLORS = [
  'from-blue-200 to-blue-600',
  'from-green-200 to-green-600',
  'from-purple-200 to-purple-600',
  'from-pink-200 to-pink-600',
  'from-orange-200 to-orange-600',
];

const today = new Date();
const isoToday = today.toISOString().split('T')[0];

const defaultProjects: Project[] = [
  {
    id: 'proj1',
    name: '网站重构项目',
    description: '公司官网全面升级改造',
    color: PROJECT_COLORS[0],
    createdAt: isoToday,
  },
  {
    id: 'proj2',
    name: '移动端App开发',
    description: 'iOS和Android原生应用开发',
    color: PROJECT_COLORS[1],
    createdAt: isoToday,
  },
];

const defaultResources: Resource[] = [
  { id: 'res1', name: '张伟', role: '前端工程师', dailyCapacity: 8 },
  { id: 'res2', name: '李娜', role: '后端工程师', dailyCapacity: 8 },
  { id: 'res3', name: '王强', role: 'UI设计师', dailyCapacity: 8 },
  { id: 'res4', name: '赵敏', role: '项目经理', dailyCapacity: 6 },
  { id: 'res5', name: '陈刚', role: '测试工程师', dailyCapacity: 8 },
];

const defaultTasks: Task[] = [
  {
    id: 'task1',
    projectId: 'proj1',
    name: '需求分析与原型设计',
    startDate: isoToday,
    endDate: addDays(today, 5).toISOString().split('T')[0],
    assigneeId: 'res4',
    dependencies: [],
    estimatedHours: 24,
    progress: 100,
  },
  {
    id: 'task2',
    projectId: 'proj1',
    name: 'UI界面设计',
    startDate: addDays(today, 3).toISOString().split('T')[0],
    endDate: addDays(today, 8).toISOString().split('T')[0],
    assigneeId: 'res3',
    dependencies: ['task1'],
    estimatedHours: 32,
    progress: 60,
  },
  {
    id: 'task3',
    projectId: 'proj1',
    name: '前端页面开发',
    startDate: addDays(today, 6).toISOString().split('T')[0],
    endDate: addDays(today, 14).toISOString().split('T')[0],
    assigneeId: 'res1',
    dependencies: ['task2'],
    estimatedHours: 64,
    progress: 30,
  },
  {
    id: 'task4',
    projectId: 'proj1',
    name: '后端API开发',
    startDate: addDays(today, 4).toISOString().split('T')[0],
    endDate: addDays(today, 12).toISOString().split('T')[0],
    assigneeId: 'res2',
    dependencies: ['task1'],
    estimatedHours: 56,
    progress: 45,
  },
  {
    id: 'task5',
    projectId: 'proj1',
    name: '系统集成测试',
    startDate: addDays(today, 13).toISOString().split('T')[0],
    endDate: addDays(today, 18).toISOString().split('T')[0],
    assigneeId: 'res5',
    dependencies: ['task3', 'task4'],
    estimatedHours: 40,
    progress: 0,
  },
  {
    id: 'task6',
    projectId: 'proj2',
    name: 'App架构设计',
    startDate: addDays(today, 2).toISOString().split('T')[0],
    endDate: addDays(today, 6).toISOString().split('T')[0],
    assigneeId: 'res4',
    dependencies: [],
    estimatedHours: 20,
    progress: 80,
  },
  {
    id: 'task7',
    projectId: 'proj2',
    name: 'iOS开发',
    startDate: addDays(today, 5).toISOString().split('T')[0],
    endDate: addDays(today, 20).toISOString().split('T')[0],
    assigneeId: 'res1',
    dependencies: ['task6'],
    estimatedHours: 80,
    progress: 20,
  },
  {
    id: 'task8',
    projectId: 'proj2',
    name: '后端服务开发',
    startDate: addDays(today, 5).toISOString().split('T')[0],
    endDate: addDays(today, 16).toISOString().split('T')[0],
    assigneeId: 'res2',
    dependencies: ['task6'],
    estimatedHours: 72,
    progress: 35,
  },
];

const detectCycleUtil = (tasks: Task[], taskId: string, dependentId: string): boolean => {
  const visited = new Set<string>();
  const stack = [dependentId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const task = tasks.find((t) => t.id === current);
    if (task) {
      stack.push(...task.dependencies);
    }
  }
  return false;
};

const topologicalSort = (tasks: Task[]): Task[] => {
  const inDegree: Record<string, number> = {};
  const graph: Record<string, string[]> = {};
  tasks.forEach((t) => {
    inDegree[t.id] = 0;
    graph[t.id] = [];
  });
  tasks.forEach((t) => {
    t.dependencies.forEach((depId) => {
      if (inDegree[depId] !== undefined) {
        inDegree[t.id]++;
        graph[depId].push(t.id);
      }
    });
  });
  const queue: string[] = [];
  tasks.forEach((t) => {
    if (inDegree[t.id] === 0) queue.push(t.id);
  });
  const result: Task[] = [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  while (queue.length > 0) {
    const id = queue.shift()!;
    const task = taskMap.get(id);
    if (task) result.push(task);
    graph[id].forEach((nextId) => {
      inDegree[nextId]--;
      if (inDegree[nextId] === 0) queue.push(nextId);
    });
  }
  tasks.forEach((t) => {
    if (!result.find((r) => r.id === t.id)) result.push(t);
  });
  return result;
};

export const useAppStore = create<AppState>((set, get) => ({
  projects: defaultProjects,
  tasks: defaultTasks,
  resources: defaultResources,
  resourceCalendars: [],
  currentProjectId: null,
  viewMode: 'month',
  dragState: { taskId: null, type: null, startX: 0, originalStart: '', originalEnd: '' },
  criticalPath: [],
  dependencyConflicts: [],
  pendingDependency: null,
  isLoading: false,

  setCurrentProject: (id) => set({ currentProjectId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDragState: (state) => set({ dragState: state }),
  setPendingDependency: (dep) => set({ pendingDependency: dep }),

  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: generateId(),
      createdAt: isoToday,
      color: PROJECT_COLORS[get().projects.length % PROJECT_COLORS.length],
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
  },

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
    })),

  addTask: (task) => {
    const newTask: Task = { ...task, id: generateId() };
    set((state) => {
      const newTasks = [...state.tasks, newTask];
      return { tasks: newTasks };
    });
    setTimeout(() => {
      get().calculateCriticalPath();
      get().checkDependencyConflicts();
    }, 0);
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    setTimeout(() => {
      get().calculateCriticalPath();
      get().checkDependencyConflicts();
    }, 0);
  },

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          dependencies: t.dependencies.filter((dep) => dep !== id),
        })),
    })),

  reorderTasks: (taskIds) =>
    set((state) => {
      const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
      return { tasks: taskIds.map((id) => taskMap.get(id)!).filter(Boolean) };
    }),

  detectCycle: (taskId, dependentId) => detectCycleUtil(get().tasks, taskId, dependentId),

  addDependency: (taskId, dependentId) => {
    const state = get();
    if (taskId === dependentId) return false;
    if (detectCycleUtil(state.tasks, taskId, dependentId)) return false;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId && !t.dependencies.includes(dependentId)
          ? { ...t, dependencies: [...t.dependencies, dependentId] }
          : t
      ),
      pendingDependency: null,
    }));
    setTimeout(() => {
      get().calculateCriticalPath();
      get().checkDependencyConflicts();
    }, 0);
    return true;
  },

  removeDependency: (taskId, dependentId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, dependencies: t.dependencies.filter((d) => d !== dependentId) }
          : t
      ),
    }));
    setTimeout(() => {
      get().calculateCriticalPath();
      get().checkDependencyConflicts();
    }, 0);
  },

  addResource: (resource) => {
    const newResource: Resource = { ...resource, id: generateId() };
    set((state) => ({ resources: [...state.resources, newResource] }));
  },

  updateResource: (id, updates) =>
    set((state) => ({
      resources: state.resources.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  deleteResource: (id) =>
    set((state) => ({
      resources: state.resources.filter((r) => r.id !== id),
      tasks: state.tasks.map((t) =>
        t.assigneeId === id ? { ...t, assigneeId: null } : t
      ),
    })),

  calculateCriticalPath: () => {
    const { tasks } = get();
    if (tasks.length === 0) {
      set({ criticalPath: [] });
      return;
    }

    const earlyStart: Record<string, number> = {};
    const earlyFinish: Record<string, number> = {};
    const lateStart: Record<string, number> = {};
    const lateFinish: Record<string, number> = {};
    const durationMap: Record<string, number> = {};

    tasks.forEach((task) => {
      const start = startOfDay(parseISO(task.startDate));
      const end = startOfDay(parseISO(task.endDate));
      const duration = Math.max(1, differenceInDays(end, start) + 1);
      durationMap[task.id] = duration;
    });

    const sorted = topologicalSort(tasks);

    for (const task of sorted) {
      const duration = durationMap[task.id];
      let maxDepFinish = 0;
      for (const depId of task.dependencies) {
        if (earlyFinish[depId] !== undefined) {
          maxDepFinish = Math.max(maxDepFinish, earlyFinish[depId]);
        }
      }
      earlyStart[task.id] = maxDepFinish;
      earlyFinish[task.id] = maxDepFinish + duration;
    }

    const maxFinish = Math.max(...Object.values(earlyFinish), 0);
    const reversed = [...sorted].reverse();

    for (const task of reversed) {
      const duration = durationMap[task.id];
      let minSuccessorStart = maxFinish;
      for (const other of tasks) {
        if (other.dependencies.includes(task.id)) {
          minSuccessorStart = Math.min(minSuccessorStart, lateStart[other.id] ?? maxFinish);
        }
      }
      lateFinish[task.id] = minSuccessorStart;
      lateStart[task.id] = minSuccessorStart - duration;
    }

    const critical: string[] = [];
    for (const task of tasks) {
      const es = earlyStart[task.id] ?? 0;
      const ef = earlyFinish[task.id] ?? 0;
      const ls = lateStart[task.id] ?? 0;
      const lf = lateFinish[task.id] ?? 0;
      const slack = Math.min(Math.abs(ls - es), Math.abs(lf - ef));
      const isMilestone = durationMap[task.id] <= 1;
      if (slack < 0.1 || (isMilestone && Math.abs(ls - es) < 0.1)) {
        critical.push(task.id);
      }
    }

    const criticalSet = new Set(critical);
    for (const taskId of critical) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (criticalSet.has(depId)) {
            criticalSet.add(depId);
          }
        }
      }
    }

    set({ criticalPath: Array.from(criticalSet) });
  },

  checkDependencyConflicts: () => {
    const { tasks } = get();
    const conflicts: DependencyConflict[] = [];

    for (const task of tasks) {
      const taskStart = startOfDay(parseISO(task.startDate));
      for (const depId of task.dependencies) {
        const depTask = tasks.find((t) => t.id === depId);
        if (!depTask) continue;
        const depEnd = startOfDay(parseISO(depTask.endDate));
        if (isBefore(taskStart, depEnd) && !isSameDay(taskStart, depEnd)) {
          conflicts.push({
            taskId: task.id,
            dependentId: depId,
            message: `任务「${task.name}」开始日期早于依赖任务「${depTask.name}」的结束日期`,
          });
        }
        if (detectCycleUtil(tasks, task.id, depId)) {
          conflicts.push({
            taskId: task.id,
            dependentId: depId,
            message: `检测到循环依赖`,
          });
        }
      }
    }

    set({ dependencyConflicts: conflicts });
  },

  getResourceLoad: (resourceId, date) => {
    const { tasks, resources } = get();
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) return 0;

    const checkDate = typeof date === 'string' ? startOfDay(parseISO(date)) : startOfDay(date);
    const checkTime = checkDate.getTime();

    let totalHours = 0;
    for (const task of tasks) {
      if (task.assigneeId !== resourceId) continue;
      const taskStart = startOfDay(parseISO(task.startDate)).getTime();
      const taskEnd = startOfDay(parseISO(task.endDate)).getTime();
      if (checkTime >= taskStart && checkTime <= taskEnd) {
        const taskDays = Math.max(1, Math.round((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1);
        totalHours += task.estimatedHours / taskDays;
      }
    }
    return totalHours;
  },
}));

setTimeout(() => {
  useAppStore.getState().calculateCriticalPath();
  useAppStore.getState().checkDependencyConflicts();
}, 0);
