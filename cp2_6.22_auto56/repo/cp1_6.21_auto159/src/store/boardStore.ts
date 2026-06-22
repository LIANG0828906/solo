import { create } from 'zustand';
import type { Board, Task, TaskPriority } from '@/types';
import * as boardService from '@/services/boardService';

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;
  tasks: Task[];
  loading: boolean;
  fetchBoards: () => Promise<void>;
  selectBoard: (id: string) => void;
  fetchTasks: (boardId: string) => Promise<void>;
  addTask: (boardId: string, data: { title: string; description: string; assignee: string; priority: TaskPriority }) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addBoard: (data: { name: string; description: string }) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoardId: null,
  tasks: [],
  loading: false,

  fetchBoards: async () => {
    set({ loading: true });
    try {
      const boards = await boardService.getBoards();
      set({ boards, loading: false });
      if (boards.length > 0 && !get().currentBoardId) {
        get().selectBoard(boards[0].id);
      }
    } catch {
      set({ loading: false });
    }
  },

  selectBoard: (id) => {
    set({ currentBoardId: id, tasks: [] });
    get().fetchTasks(id);
  },

  fetchTasks: async (boardId) => {
    set({ loading: true });
    try {
      const tasks = await boardService.getTasksByBoard(boardId);
      set({ tasks, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTask: async (boardId, data) => {
    const task = await boardService.createTask(boardId, data);
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  updateTask: async (id, data) => {
    const updated = await boardService.updateTask(id, data);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  removeTask: async (id) => {
    await boardService.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  addBoard: async (data) => {
    const board = await boardService.createBoard(data);
    set((s) => ({ boards: [...s.boards, board] }));
    get().selectBoard(board.id);
  },

  removeBoard: async (id) => {
    await boardService.deleteBoard(id);
    const boards = get().boards.filter((b) => b.id !== id);
    set((s) => ({
      boards,
      currentBoardId: s.currentBoardId === id ? (boards[0]?.id ?? null) : s.currentBoardId,
      tasks: s.currentBoardId === id ? [] : s.tasks,
    }));
    if (get().currentBoardId) {
      get().fetchTasks(get().currentBoardId!);
    }
  },
}));
