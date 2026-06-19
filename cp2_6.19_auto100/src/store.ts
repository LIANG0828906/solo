import { create } from 'zustand';
import { TaskType, PomodoroRecord } from '@/utils/storage';

export interface TaskInput {
  taskName: string;
  taskDescription: string;
  taskType: TaskType;
  moodScore: number;
}

interface TimerState {
  todayPomodoros: PomodoroRecord[];
  currentSession: number;
  isRunning: boolean;
  isBreak: boolean;
  setTodayPomodoros: (records: PomodoroRecord[]) => void;
  addPomodoro: (record: PomodoroRecord) => void;
  setCurrentSession: (n: number) => void;
  setIsRunning: (v: boolean) => void;
  setIsBreak: (v: boolean) => void;
}

export const useStore = create<TimerState>((set) => ({
  todayPomodoros: [],
  currentSession: 1,
  isRunning: false,
  isBreak: false,
  setTodayPomodoros: (records) => set({ todayPomodoros: records, currentSession: records.length + 1 }),
  addPomodoro: (record) =>
    set((state) => ({
      todayPomodoros: [...state.todayPomodoros, record],
      currentSession: state.todayPomodoros.length + 2,
    })),
  setCurrentSession: (n) => set({ currentSession: n }),
  setIsRunning: (v) => set({ isRunning: v }),
  setIsBreak: (v) => set({ isBreak: v }),
}));

export interface TaskStore {
  input: TaskInput;
  setInput: (input: TaskInput) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  input: {
    taskName: '',
    taskDescription: '',
    taskType: 'work',
    moodScore: 3,
  },
  setInput: (input) => set({ input }),
}));
