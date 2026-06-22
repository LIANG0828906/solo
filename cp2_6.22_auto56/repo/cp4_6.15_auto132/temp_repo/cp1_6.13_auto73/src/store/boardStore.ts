import { create } from 'zustand';
import type { Board, BoardData, Task, BoardUpdateEvent } from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface BoardState {
  boards: Board[];
  currentBoardId: string;
  loading: boolean;
  toasts: Toast[];
  setBoards: (data: BoardData) => void;
  setCurrentBoardId: (id: string) => void;
  getCurrentBoard: () => Board | undefined;
  setLoading: (loading: boolean) => void;
  updateTaskLocally: (
    taskId: string,
    targetColumnId: string,
    task: Task
  ) => void;
  updateTaskInColumn: (
    task: Task,
    sourceColumnId: string,
    targetColumnId: string
  ) => void;
  handleBoardUpdate: (event: BoardUpdateEvent, currentUserId: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoardId: '',
  loading: false,
  toasts: [],

  setBoards: (data) => {
    set({
      boards: data.boards,
      currentBoardId: data.boards[0]?.id || '',
    });
  },

  setCurrentBoardId: (id) => set({ currentBoardId: id }),

  getCurrentBoard: () => {
    const { boards, currentBoardId } = get();
    return boards.find((b) => b.id === currentBoardId);
  },

  setLoading: (loading) => set({ loading }),

  updateTaskLocally: (taskId, targetColumnId, updatedTask) => {
    set((state) => {
      const newBoards = state.boards.map((board) => {
        if (board.id !== state.currentBoardId) return board;
        return {
          ...board,
          columns: board.columns.map((col) => {
            if (col.id === targetColumnId) {
              const taskIndex = col.tasks.findIndex((t) => t.id === taskId);
              if (taskIndex !== -1) {
                const newTasks = [...col.tasks];
                newTasks[taskIndex] = updatedTask;
                return { ...col, tasks: newTasks };
              }
            }
            return col;
          }),
        };
      });
      return { boards: newBoards };
    });
  },

  updateTaskInColumn: (task, sourceColumnId, targetColumnId) => {
    set((state) => {
      const newBoards = state.boards.map((board) => {
        if (board.id !== state.currentBoardId) return board;
        return {
          ...board,
          columns: board.columns.map((col) => {
            if (col.id === sourceColumnId) {
              return {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== task.id),
              };
            }
            if (col.id === targetColumnId) {
              return {
                ...col,
                tasks: [...col.tasks, task],
              };
            }
            return col;
          }),
        };
      });
      return { boards: newBoards };
    });
  },

  handleBoardUpdate: (event, currentUserId) => {
    const { boardId, action, task, user, taskTitle } = event;
    const state = get();

    if (boardId !== state.currentBoardId) return;

    set((state) => {
      const newBoards = state.boards.map((board) => {
        if (board.id !== boardId) return board;

        if (action === 'deleted') {
          return {
            ...board,
            columns: board.columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== task.id),
            })),
          };
        }

        if (action === 'created') {
          return {
            ...board,
            columns: board.columns.map((col) => {
              if (col.id === event.columnId) {
                return { ...col, tasks: [...col.tasks, task] };
              }
              return col;
            }),
          };
        }

        return {
          ...board,
          columns: board.columns.map((col) => {
            const hasTask = col.tasks.some((t) => t.id === task.id);
            if (action === 'moved') {
              if (col.id === event.columnId && !hasTask) {
                return { ...col, tasks: [...col.tasks, task] };
              }
              if (col.id !== event.columnId && hasTask) {
                return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
              }
            }
            if (action === 'updated' && hasTask) {
              return {
                ...col,
                tasks: col.tasks.map((t) => (t.id === task.id ? task : t)),
              };
            }
            return col;
          }),
        };
      });

      return { boards: newBoards };
    });

    if (user !== currentUserId) {
      let message = '';
      switch (action) {
        case 'moved':
          message = `${user} 移动了任务：${taskTitle}`;
          break;
        case 'updated':
          message = `${user} 更新了任务：${taskTitle}`;
          break;
        case 'created':
          message = `${user} 创建了任务：${taskTitle}`;
          break;
        case 'deleted':
          message = `${user} 删除了任务：${taskTitle}`;
          break;
      }
      if (message) {
        get().addToast({ message, type: 'info' });
      }
    }
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
