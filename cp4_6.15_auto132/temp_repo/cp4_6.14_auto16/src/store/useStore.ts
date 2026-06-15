import { create } from 'zustand';
import type { Task, TeamMember, Lane, TaskStatus } from '@/utils/types';
import { DEFAULT_LANES } from '@/utils/types';
import { MOCK_MEMBERS, MOCK_TASKS, MOCK_HEATMAP_DATA } from '@/utils/mockData';
import type { HeatmapCell } from '@/utils/types';

interface StoreState {
  tasks: Task[];
  members: TeamMember[];
  lanes: Lane[];
  editingTask: Task | null;
  heatmapData: HeatmapCell[];
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;

  setTasks: (tasks: Task[]) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  deleteTask: (id: string) => void;
  setEditingTask: (task: Task | null) => void;
  reorderTasksInLane: (
    status: TaskStatus,
    fromIndex: number,
    toIndex: number
  ) => void;
  moveTaskToLane: (
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    toIndex: number
  ) => void;
  reassignTask: (taskId: string, newAssigneeId: string | null) => void;
  renameLane: (laneId: string, newName: string) => void;
  reorderLanes: (fromIndex: number, toIndex: number) => void;
  addLane: (name: string, status: TaskStatus) => void;
  removeLane: (laneId: string) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  tasks: MOCK_TASKS,
  members: MOCK_MEMBERS,
  lanes: DEFAULT_LANES,
  editingTask: null,
  heatmapData: MOCK_HEATMAP_DATA,
  sidebarCollapsed: false,
  rightPanelCollapsed: false,

  setTasks: (tasks) => set({ tasks }),

  updateTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t
      ),
      editingTask: null,
    })),

  addTask: (task) =>
    set((state) => {
      const laneTasks = state.tasks.filter((t) => t.status === task.status);
      const maxOrder = laneTasks.length > 0
        ? Math.max(...laneTasks.map((t) => t.order)) + 1
        : 0;
      const newTask: Task = {
        ...task,
        id: `t-${Date.now()}`,
        order: maxOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { tasks: [...state.tasks, newTask] };
    }),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  setEditingTask: (task) => set({ editingTask: task }),

  reorderTasksInLane: (status, fromIndex, toIndex) =>
    set((state) => {
      const laneTasks = state.tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.order - b.order);
      
      if (fromIndex < 0 || fromIndex >= laneTasks.length) return state;
      if (toIndex < 0 || toIndex >= laneTasks.length) return state;

      const [removed] = laneTasks.splice(fromIndex, 1);
      laneTasks.splice(toIndex, 0, removed);

      const reorderedIds = new Set(laneTasks.map((t) => t.id));
      const otherTasks = state.tasks.filter((t) => !reorderedIds.has(t.id));
      const updatedLaneTasks = laneTasks.map((t, idx) => ({ ...t, order: idx }));

      return { tasks: [...otherTasks, ...updatedLaneTasks] };
    }),

  moveTaskToLane: (taskId, fromStatus, toStatus, toIndex) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const toLaneTasks = state.tasks
        .filter((t) => t.status === toStatus && t.id !== taskId)
        .sort((a, b) => a.order - b.order);

      const movedTask = {
        ...task,
        status: toStatus,
        updatedAt: new Date().toISOString(),
      };

      toLaneTasks.splice(toIndex, 0, movedTask);
      const updatedToLane = toLaneTasks.map((t, idx) => ({ ...t, order: idx }));

      const fromLaneTasks = state.tasks
        .filter((t) => t.status === fromStatus && t.id !== taskId)
        .sort((a, b) => a.order - b.order)
        .map((t, idx) => ({ ...t, order: idx }));

      const otherTasks = state.tasks.filter(
        (t) => t.status !== fromStatus && t.status !== toStatus
      );

      return { tasks: [...otherTasks, ...fromLaneTasks, ...updatedToLane] };
    }),

  reassignTask: (taskId, newAssigneeId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, assigneeId: newAssigneeId, updatedAt: new Date().toISOString() }
          : t
      ),
    })),

  renameLane: (laneId, newName) =>
    set((state) => ({
      lanes: state.lanes.map((l) =>
        l.id === laneId ? { ...l, name: newName } : l
      ),
    })),

  reorderLanes: (fromIndex, toIndex) =>
    set((state) => {
      const sortedLanes = [...state.lanes].sort((a, b) => a.order - b.order);
      if (fromIndex < 0 || fromIndex >= sortedLanes.length) return state;
      if (toIndex < 0 || toIndex >= sortedLanes.length) return state;

      const [removed] = sortedLanes.splice(fromIndex, 1);
      sortedLanes.splice(toIndex, 0, removed);

      return {
        lanes: sortedLanes.map((l, idx) => ({ ...l, order: idx })),
      };
    }),

  addLane: (name, status) =>
    set((state) => {
      if (state.lanes.length >= 6) return state;
      const maxOrder = state.lanes.reduce(
        (max, l) => Math.max(max, l.order),
        -1
      );
      const newLane: Lane = {
        id: `lane-${Date.now()}`,
        name,
        status,
        order: maxOrder + 1,
      };
      return { lanes: [...state.lanes, newLane] };
    }),

  removeLane: (laneId) =>
    set((state) => {
      if (state.lanes.length <= 2) return state;
      const lane = state.lanes.find((l) => l.id === laneId);
      if (!lane) return state;

      const sortedLanes = state.lanes
        .filter((l) => l.id !== laneId)
        .sort((a, b) => a.order - b.order)
        .map((l, idx) => ({ ...l, order: idx }));

      const tasksToReassign = state.tasks.filter(
        (t) => t.status === lane.status
      );
      const newStatus = sortedLanes[0]?.status || 'todo';
      const reassignedTasks = tasksToReassign.map((t) => ({
        ...t,
        status: newStatus as TaskStatus,
      }));
      const otherTasks = state.tasks.filter(
        (t) => t.status !== lane.status
      );

      return { lanes: sortedLanes, tasks: [...otherTasks, ...reassignedTasks] };
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleRightPanel: () =>
    set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
}));
