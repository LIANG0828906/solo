import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { parseISO, differenceInDays } from 'date-fns';
import { todosStore, getAllItems, getItem, setItem, deleteItem } from '@/utils/db';

export type TodoStatus = 'pending' | 'in-progress' | 'completed';

export interface TodoItem {
  id: string;
  meetingId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TodoStatus;
  createdAt: number;
}

interface TaskState {
  todos: TodoItem[];
  loading: boolean;
}

interface TaskActions {
  fetchTodos: () => Promise<void>;
  getTodoById: (id: string) => Promise<TodoItem | null>;
  getTodosByMeetingId: (meetingId: string) => Promise<TodoItem[]>;
  createTodo: (data: Omit<TodoItem, 'id' | 'status' | 'createdAt'> & { status?: TodoStatus }) => Promise<TodoItem>;
  updateTodo: (id: string, data: Partial<TodoItem>) => Promise<void>;
  updateTodoStatus: (id: string, status: TodoStatus) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  deleteTodosByMeetingId: (meetingId: string) => Promise<void>;
  getTodosByStatus: (status: TodoStatus) => TodoItem[];
  isDueSoon: (dueDate: string, days?: number) => boolean;
  isOverdue: (dueDate: string) => boolean;
}

export type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>((set, get) => ({
  todos: [],
  loading: false,

  fetchTodos: async () => {
    set({ loading: true });
    try {
      const todos = await getAllItems<TodoItem>(todosStore);
      todos.sort((a, b) => a.createdAt - b.createdAt);
      set({ todos, loading: false });
    } catch (e) {
      console.error('Failed to fetch todos:', e);
      set({ loading: false });
    }
  },

  getTodoById: async (id) => {
    const todo = await getItem<TodoItem>(id, todosStore);
    return todo || null;
  },

  getTodosByMeetingId: async (meetingId) => {
    const todos = await getAllItems<TodoItem>(todosStore);
    return todos.filter((t) => t.meetingId === meetingId);
  },

  createTodo: async (data) => {
    const now = Date.now();
    const todo: TodoItem = {
      id: uuidv4(),
      meetingId: data.meetingId,
      title: data.title,
      assignee: data.assignee,
      dueDate: data.dueDate,
      status: data.status || 'pending',
      createdAt: now,
    };

    await setItem(todo.id, todo, todosStore);
    set((state) => ({
      todos: [...state.todos, todo],
    }));

    return todo;
  },

  updateTodo: async (id, data) => {
    const existing = await getItem<TodoItem>(id, todosStore);
    if (!existing) return;

    const updated: TodoItem = {
      ...existing,
      ...data,
    };

    await setItem(id, updated, todosStore);
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? updated : t)),
    }));
  },

  updateTodoStatus: async (id, status) => {
    await get().updateTodo(id, { status });
  },

  deleteTodo: async (id) => {
    await deleteItem(id, todosStore);
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    }));
  },

  deleteTodosByMeetingId: async (meetingId) => {
    const all = await getAllItems<TodoItem>(todosStore);
    const toDelete = all.filter((t) => t.meetingId === meetingId);

    for (const todo of toDelete) {
      await deleteItem(todo.id, todosStore);
    }

    set((state) => ({
      todos: state.todos.filter((t) => t.meetingId !== meetingId),
    }));
  },

  getTodosByStatus: (status) => {
    return get().todos.filter((t) => t.status === status);
  },

  isDueSoon: (dueDate, days = 3) => {
    try {
      const due = parseISO(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = differenceInDays(due, today);
      return diff >= 0 && diff <= days;
    } catch {
      return false;
    }
  },

  isOverdue: (dueDate) => {
    try {
      const due = parseISO(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return differenceInDays(due, today) < 0;
    } catch {
      return false;
    }
  },
}));
