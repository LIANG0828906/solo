import { create } from 'zustand';
import type { User, Board, TaskDetail, Toast } from '../types';

interface AppState {
  user: User | null;
  boards: Board[];
  currentBoard: Board | null;
  currentTask: TaskDetail | null;
  toasts: Toast[];
  setUser: (user: User | null) => void;
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (board: Board | null) => void;
  setCurrentTask: (task: TaskDetail | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  updateTaskInBoard: (task: TaskDetail) => void;
  addTaskToBoard: (task: TaskDetail) => void;
  removeTaskFromBoard: (taskId: string) => void;
  updateBoard: (board: Board) => void;
  addBoard: (board: Board) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  boards: [],
  currentBoard: null,
  currentTask: null,
  toasts: [],

  setUser: (user) => set({ user }),
  setBoards: (boards) => set({ boards }),
  setCurrentBoard: (board) => set({ currentBoard: board }),
  setCurrentTask: (task) => set({ currentTask: task }),

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: `toast-${Date.now()}` }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  updateTaskInBoard: (updatedTask) =>
    set((state) => {
      if (!state.currentBoard) return state;
      const updatedTasks = state.currentBoard.tasks.map((t) =>
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
      );
      return {
        currentBoard: { ...state.currentBoard, tasks: updatedTasks },
      };
    }),

  addTaskToBoard: (newTask) =>
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          tasks: [...state.currentBoard.tasks, newTask],
        },
      };
    }),

  removeTaskFromBoard: (taskId) =>
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          tasks: state.currentBoard.tasks.filter((t) => t.id !== taskId),
        },
      };
    }),

  updateBoard: (board) =>
    set((state) => {
      const updatedBoards = state.boards.map((b) =>
        b.id === board.id ? { ...b, ...board } : b
      );
      const isCurrent = state.currentBoard?.id === board.id;
      return {
        boards: updatedBoards,
        currentBoard: isCurrent ? board : state.currentBoard,
      };
    }),

  addBoard: (board) =>
    set((state) => ({
      boards: [...state.boards, board],
    })),
}));
