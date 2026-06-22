import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  getStoreData,
  setStoreData,
  type AppData,
} from '@/utils/db';
import { seedMockData } from '@/data/mockData';
import type {
  Volunteer,
  Project,
  Task,
  TaskClaim,
  Transaction,
  Statistics,
} from '@/types';

const customStorage: PersistStorage<AppStoreState> = {
  getItem: (_name) => {
    const data = getStoreData();
    if (!data) return null;
    return {
      state: {
        volunteers: data.volunteers,
        projects: data.projects,
        tasks: data.tasks,
        taskClaims: data.taskClaims,
        transactions: data.transactions,
        currentVolunteerId: data.currentVolunteerId,
      },
      version: 0,
    };
  },
  setItem: (_name, value) => {
    const appData: AppData = {
      volunteers: value.state.volunteers,
      projects: value.state.projects,
      tasks: value.state.tasks,
      taskClaims: value.state.taskClaims,
      transactions: value.state.transactions,
      currentVolunteerId: value.state.currentVolunteerId,
      _initialized: true,
    };
    setStoreData(appData);
  },
  removeItem: (_name) => {
    localStorage.removeItem('timegift_app_data');
  },
};

export interface AppStoreState {
  volunteers: Volunteer[];
  projects: Project[];
  tasks: Task[];
  taskClaims: TaskClaim[];
  transactions: Transaction[];
  currentVolunteerId: string | null;
}

export interface AppStoreActions {
  addVolunteer: (data: Omit<Volunteer, 'id' | 'balance' | 'donated_hours' | 'completed_hours' | 'created_at' | 'last_active'> & Partial<Pick<Volunteer, 'balance' | 'donated_hours' | 'completed_hours'>>) => void;
  donateTime: (volunteerId: string, projectId: string, hours: number, desc?: string) => { success: boolean; error?: string };
  createProject: (data: Omit<Project, 'id' | 'achieved_hours' | 'status' | 'created_at'>, tasks?: Omit<Task, 'id' | 'project_id' | 'status' | 'created_at'>[]) => void;
  claimTask: (taskId: string, volunteerId: string) => void;
  submitProof: (claimId: string, proofText?: string, proofImage?: string) => void;
  approveClaim: (claimId: string) => void;
  setCurrentVolunteer: (id: string | null) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

function computeStatistics(state: AppStoreState, currentVolunteerId: string | null): Statistics {
  const totalDonatedHours = state.transactions
    .filter((t) => t.type === 'donate')
    .reduce((sum, t) => sum + t.hours, 0);

  const activeProjectCount = state.projects.filter((p) => p.status === 'active').length;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayNewVolunteers = state.volunteers.filter((v) => {
    const vDate = v.created_at.split('T')[0];
    return vDate === todayStr;
  }).length;

  let volunteerRankPercentile = 0;
  if (currentVolunteerId) {
    const current = state.volunteers.find((v) => v.id === currentVolunteerId);
    if (current) {
      const sorted = [...state.volunteers].sort(
        (a, b) => b.completed_hours - a.completed_hours
      );
      const rank = sorted.findIndex((v) => v.id === currentVolunteerId);
      volunteerRankPercentile = state.volunteers.length > 0
        ? Math.round(((rank + 1) / state.volunteers.length) * 100)
        : 0;
    }
  }

  const weekDonationTrend: { date: string; hours: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hours = state.transactions
      .filter((t) => t.type === 'donate' && t.created_at.split('T')[0] === dateStr)
      .reduce((sum, t) => sum + t.hours, 0);
    weekDonationTrend.push({ date: dateStr, hours });
  }

  return {
    totalDonatedHours,
    activeProjectCount,
    todayNewVolunteers,
    volunteerRankPercentile,
    weekDonationTrend,
  };
}

function computeRankedVolunteers(volunteers: Volunteer[]): Volunteer[] {
  return [...volunteers].sort((a, b) => {
    const scoreA = a.completed_hours + a.donated_hours;
    const scoreB = b.completed_hours + b.donated_hours;
    return scoreB - scoreA;
  });
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      volunteers: [],
      projects: [],
      tasks: [],
      taskClaims: [],
      transactions: [],
      currentVolunteerId: null,

      addVolunteer: (data) => {
        const now = new Date().toISOString();
        const newVolunteer: Volunteer = {
          id: uuidv4(),
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          balance: data.balance ?? 100,
          donated_hours: data.donated_hours ?? 0,
          completed_hours: data.completed_hours ?? 0,
          created_at: now,
          last_active: now,
        };
        set((state) => ({
          volunteers: [...state.volunteers, newVolunteer],
        }));
      },

      donateTime: (volunteerId, projectId, hours, desc) => {
        const state = get();
        const volunteer = state.volunteers.find((v) => v.id === volunteerId);
        if (!volunteer) {
          return { success: false, error: '志愿者不存在' };
        }
        if (volunteer.balance < hours) {
          return { success: false, error: '余额不足' };
        }
        const now = new Date().toISOString();
        const txId = uuidv4();
        const transaction: Transaction = {
          id: txId,
          volunteer_id: volunteerId,
          project_id: projectId,
          type: 'donate',
          hours,
          description: desc,
          created_at: now,
        };
        set((s) => ({
          volunteers: s.volunteers.map((v) =>
            v.id === volunteerId
              ? {
                  ...v,
                  balance: v.balance - hours,
                  donated_hours: v.donated_hours + hours,
                  last_active: now,
                }
              : v
          ),
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, achieved_hours: p.achieved_hours + hours }
              : p
          ),
          transactions: [...s.transactions, transaction],
        }));
        return { success: true };
      },

      createProject: (data, tasks) => {
        const now = new Date().toISOString();
        const projectId = uuidv4();
        const newProject: Project = {
          id: projectId,
          title: data.title,
          description: data.description,
          goal_hours: data.goal_hours,
          achieved_hours: 0,
          status: 'active',
          created_at: now,
          cover_image: data.cover_image,
          category: data.category,
        };
        const newTasks: Task[] = (tasks ?? []).map((t) => ({
          id: uuidv4(),
          project_id: projectId,
          title: t.title,
          description: t.description,
          required_hours: t.required_hours,
          status: 'open',
          created_at: now,
        }));
        set((state) => ({
          projects: [...state.projects, newProject],
          tasks: [...state.tasks, ...newTasks],
        }));
      },

      claimTask: (taskId, volunteerId) => {
        const now = new Date().toISOString();
        const claimId = uuidv4();
        const newClaim: TaskClaim = {
          id: claimId,
          task_id: taskId,
          volunteer_id: volunteerId,
          status: 'in_progress',
          claimed_at: now,
        };
        set((state) => ({
          taskClaims: [...state.taskClaims, newClaim],
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'in_progress' } : t
          ),
        }));
      },

      submitProof: (claimId, proofText, proofImage) => {
        const now = new Date().toISOString();
        set((state) => ({
          taskClaims: state.taskClaims.map((c) =>
            c.id === claimId
              ? {
                  ...c,
                  status: 'submitted',
                  proof_text: proofText,
                  proof_image: proofImage,
                  submitted_at: now,
                }
              : c
          ),
          tasks: state.tasks.map((t) => {
            const claim = state.taskClaims.find((c) => c.id === claimId);
            return claim && t.id === claim.task_id
              ? { ...t, status: 'submitted' }
              : t;
          }),
        }));
      },

      approveClaim: (claimId) => {
        const now = new Date().toISOString();
        const state = get();
        const claim = state.taskClaims.find((c) => c.id === claimId);
        if (!claim) return;
        const task = state.tasks.find((t) => t.id === claim.task_id);
        if (!task) return;
        const txId = uuidv4();
        const transaction: Transaction = {
          id: txId,
          volunteer_id: claim.volunteer_id,
          task_id: task.id,
          project_id: task.project_id,
          type: 'complete',
          hours: task.required_hours,
          description: `完成任务: ${task.title}`,
          created_at: now,
        };
        set((s) => ({
          taskClaims: s.taskClaims.map((c) =>
            c.id === claimId
              ? { ...c, status: 'approved', approved_at: now }
              : c
          ),
          tasks: s.tasks.map((t) =>
            t.id === task.id ? { ...t, status: 'completed' } : t
          ),
          volunteers: s.volunteers.map((v) =>
            v.id === claim.volunteer_id
              ? {
                  ...v,
                  completed_hours: v.completed_hours + task.required_hours,
                  last_active: now,
                }
              : v
          ),
          transactions: [...s.transactions, transaction],
        }));
      },

      setCurrentVolunteer: (id) => {
        set({ currentVolunteerId: id });
      },
    }),
    {
      name: 'timegift-app-storage',
      storage: customStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        if (!state) return;
        const isEmpty =
          state.volunteers.length === 0 &&
          state.projects.length === 0 &&
          state.tasks.length === 0;
        if (isEmpty) {
          const actions = {
            addVolunteer: state.addVolunteer,
            createProject: state.createProject,
          };
          seedMockData(actions);
        }
      },
    }
  )
);

export const useVolunteers = () => useAppStore((s) => s.volunteers);
export const useProjects = () => useAppStore((s) => s.projects);
export const useTasks = () => useAppStore((s) => s.tasks);
export const useTaskClaims = () => useAppStore((s) => s.taskClaims);
export const useTransactions = () => useAppStore((s) => s.transactions);
export const useCurrentVolunteerId = () => useAppStore((s) => s.currentVolunteerId);

export const useCurrentVolunteer = () =>
  useAppStore((s) =>
    s.currentVolunteerId
      ? s.volunteers.find((v) => v.id === s.currentVolunteerId) ?? null
      : null
  );

export const useStatistics = (): Statistics =>
  useAppStore((s) => computeStatistics(s, s.currentVolunteerId));

export const useRankedVolunteers = (): Volunteer[] =>
  useAppStore((s) => computeRankedVolunteers(s.volunteers));

export const useProjectTasks = (projectId: string): Task[] =>
  useAppStore((s) => s.tasks.filter((t) => t.project_id === projectId));

export const useVolunteerTasks = (volunteerId: string): TaskClaim[] =>
  useAppStore((s) => s.taskClaims.filter((c) => c.volunteer_id === volunteerId));

export const useVolunteerTransactions = (volunteerId: string): Transaction[] =>
  useAppStore((s) =>
    s.transactions.filter((t) => t.volunteer_id === volunteerId)
  );
