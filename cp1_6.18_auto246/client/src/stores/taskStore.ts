import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import type { Task, TaskStatus, TaskPriority, ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface TaskState {
  tasks: Task[];
  draggingTaskId: string | null;
  dragOverColumn: TaskStatus | null;
  dropIndex: number | null;
  onlineUsers: number;
  notification: string | null;
  newlyCreatedIds: Set<string>;
  justDroppedIds: Set<string>;
  deletingIds: Set<string>;
  expandedIds: Set<string>;
  remoteUpdateIds: Set<string>;
  socket: SocketType | null;

  setSocket: (socket: SocketType) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task, isRemote?: boolean) => void;
  updateTask: (task: Task, isRemote?: boolean) => void;
  deleteTask: (taskId: string, isRemote?: boolean) => void;

  createTask: (title: string) => void;
  changeTaskStatus: (taskId: string, newStatus: TaskStatus, newIndex?: number) => void;
  changeTaskPriority: (taskId: string, priority: TaskPriority) => void;
  removeTask: (taskId: string) => void;

  setDraggingTask: (taskId: string | null) => void;
  setDragOverColumn: (column: TaskStatus | null) => void;
  setDropIndex: (index: number | null) => void;

  setOnlineUsers: (count: number) => void;
  showNotification: (message: string) => void;
  clearNotification: () => void;

  toggleExpand: (taskId: string) => void;

  clearNewlyCreated: (taskId: string) => void;
  clearJustDropped: (taskId: string) => void;
  clearDeleting: (taskId: string) => void;
  clearRemoteUpdate: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  draggingTaskId: null,
  dragOverColumn: null,
  dropIndex: null,
  onlineUsers: 0,
  notification: null,
  newlyCreatedIds: new Set(),
  justDroppedIds: new Set(),
  deletingIds: new Set(),
  expandedIds: new Set(),
  remoteUpdateIds: new Set(),
  socket: null,

  setSocket: (socket) => set({ socket }),

  setTasks: (tasks) => set({ tasks }),

  addTask: (task, isRemote = false) => {
    set((state) => {
      const newIds = new Set(state.newlyCreatedIds);
      if (!isRemote) {
        newIds.add(task.id);
      }
      return {
        tasks: [...state.tasks, task],
        newlyCreatedIds: newIds
      };
    });
  },

  updateTask: (task, isRemote = false) => {
    set((state) => {
      const remoteIds = new Set(state.remoteUpdateIds);
      const droppedIds = new Set(state.justDroppedIds);
      if (isRemote) {
        remoteIds.add(task.id);
      } else {
        droppedIds.add(task.id);
      }
      return {
        tasks: state.tasks.map(t => (t.id === task.id ? task : t)),
        remoteUpdateIds: remoteIds,
        justDroppedIds: droppedIds
      };
    });
  },

  deleteTask: (taskId, isRemote = false) => {
    if (isRemote) {
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }));
    } else {
      set((state) => {
        const delIds = new Set(state.deletingIds);
        delIds.add(taskId);
        return { deletingIds: delIds };
      });
      setTimeout(() => {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
          deletingIds: new Set([...state.deletingIds].filter(id => id !== taskId))
        }));
      }, 300);
    }
  },

  createTask: (title) => {
    const { socket } = get();
    if (!socket || !title.trim()) return;
    socket.emit('task:create', {
      title: title.trim(),
      status: 'todo',
      priority: 'medium'
    });
  },

  changeTaskStatus: (taskId, newStatus, newIndex) => {
    const { socket, tasks } = get();
    if (!socket) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, status: newStatus };
    socket.emit('task:update', updatedTask);
  },

  changeTaskPriority: (taskId, priority) => {
    const { socket, tasks } = get();
    if (!socket) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, priority };
    socket.emit('task:update', updatedTask);
  },

  removeTask: (taskId) => {
    const { socket } = get();
    if (!socket) return;
    get().deleteTask(taskId, false);
    socket.emit('task:delete', taskId);
  },

  setDraggingTask: (taskId) => set({ draggingTaskId: taskId }),
  setDragOverColumn: (column) => set({ dragOverColumn: column }),
  setDropIndex: (index) => set({ dropIndex: index }),

  setOnlineUsers: (count) => set({ onlineUsers: count }),
  showNotification: (message) => set({ notification: message }),
  clearNotification: () => set({ notification: null }),

  toggleExpand: (taskId) => {
    set((state) => {
      const expanded = new Set(state.expandedIds);
      if (expanded.has(taskId)) {
        expanded.delete(taskId);
      } else {
        expanded.add(taskId);
      }
      return { expandedIds: expanded };
    });
  },

  clearNewlyCreated: (taskId) => {
    set((state) => {
      const newIds = new Set(state.newlyCreatedIds);
      newIds.delete(taskId);
      return { newlyCreatedIds: newIds };
    });
  },
  clearJustDropped: (taskId) => {
    set((state) => {
      const droppedIds = new Set(state.justDroppedIds);
      droppedIds.delete(taskId);
      return { justDroppedIds: droppedIds };
    });
  },
  clearDeleting: (taskId) => {
    set((state) => {
      const delIds = new Set(state.deletingIds);
      delIds.delete(taskId);
      return { deletingIds: delIds };
    });
  },
  clearRemoteUpdate: (taskId) => {
    set((state) => {
      const remoteIds = new Set(state.remoteUpdateIds);
      remoteIds.delete(taskId);
      return { remoteUpdateIds: remoteIds };
    });
  }
}));
