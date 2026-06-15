import { create } from 'zustand';
import type { Task, Dependency, Comment, Vote, TeamMember, ActiveTab } from './types';

interface AppState {
  tasks: Task[];
  dependencies: Dependency[];
  comments: Comment[];
  votes: Vote[];
  teamMembers: TeamMember[];
  activeTab: ActiveTab;
  highlightedTaskId: string | null;
  searchQuery: string;
  sidebarOpen: boolean;
  currentMemberId: string;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  moveTask: (task: Task) => void;
  deleteTask: (id: string) => void;

  setDependencies: (deps: Dependency[]) => void;
  addDependency: (dep: Dependency) => void;
  removeDependency: (id: string) => void;

  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;

  setVotes: (votes: Vote[]) => void;

  setTeamMembers: (members: TeamMember[]) => void;
  updateMemberStatus: (id: string, online: boolean) => void;

  setActiveTab: (tab: ActiveTab) => void;
  setHighlightedTaskId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  tasks: [],
  dependencies: [],
  comments: [],
  votes: [],
  teamMembers: [],
  activeTab: 'board',
  highlightedTaskId: null,
  searchQuery: '',
  sidebarOpen: true,
  currentMemberId: 'm1',

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (task) => set((s) => ({
    tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
  })),
  moveTask: (task) => set((s) => ({
    tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, lane: task.lane, order: task.order, remainingHours: task.remainingHours ?? t.remainingHours } : t)),
  })),
  deleteTask: (id) => set((s) => ({
    tasks: s.tasks.filter((t) => t.id !== id),
    dependencies: s.dependencies.filter((d) => d.fromTaskId !== id && d.toTaskId !== id),
  })),

  setDependencies: (deps) => set({ dependencies: deps }),
  addDependency: (dep) => set((s) => ({ dependencies: [...s.dependencies, dep] })),
  removeDependency: (id) => set((s) => ({
    dependencies: s.dependencies.filter((d) => d.id !== id),
  })),

  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((s) => ({ comments: [...s.comments, comment] })),

  setVotes: (votes) => set({ votes }),

  setTeamMembers: (members) => set({ teamMembers: members }),
  updateMemberStatus: (id, online) => set((s) => ({
    teamMembers: s.teamMembers.map((m) => (m.id === id ? { ...m, online } : m)),
  })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setHighlightedTaskId: (id) => set({ highlightedTaskId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
