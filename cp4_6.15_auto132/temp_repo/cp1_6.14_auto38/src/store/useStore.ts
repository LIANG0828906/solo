import { create } from 'zustand';
import type { Member, Task, Reward, Category } from '@/types';

interface Store {
  members: Member[];
  tasks: Task[];
  rewards: Reward[];
  categories: Category[];
  currentMemberId: string | null;
  isLoading: boolean;
  setMembers: (members: Member[]) => void;
  setTasks: (tasks: Task[]) => void;
  setRewards: (rewards: Reward[]) => void;
  setCategories: (categories: Category[]) => void;
  setCurrentMemberId: (id: string | null) => void;
  updateTask: (task: Task) => void;
  updateMember: (member: Member) => void;
  addTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  addReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  members: [],
  tasks: [],
  rewards: [],
  categories: [],
  currentMemberId: null,
  isLoading: false,
  setMembers: (members) => set({ members }),
  setTasks: (tasks) => set({ tasks }),
  setRewards: (rewards) => set({ rewards }),
  setCategories: (categories) => set({ categories }),
  setCurrentMemberId: (id) => set({ currentMemberId: id }),
  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    })),
  updateMember: (updatedMember) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === updatedMember.id ? updatedMember : m)),
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  addMember: (member) =>
    set((state) => ({
      members: [...state.members, member],
    })),
  deleteMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),
  addReward: (reward) =>
    set((state) => ({
      rewards: [...state.rewards, reward],
    })),
  deleteReward: (id) =>
    set((state) => ({
      rewards: state.rewards.filter((r) => r.id !== id),
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
