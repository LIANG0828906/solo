import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  Stage,
  Attachment,
  CreateProjectInput,
  FilterStatus,
  SortType,
  ProjectStatus,
  STAGE_NAMES,
} from './types';

const STORAGE_KEY = 'artflow_projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

let saveTimer: number | null = null;
function saveProjects(projects: Project[]) {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      /* ignore quota errors */
    }
  }, 50);
}

function createStages(): Stage[] {
  return STAGE_NAMES.map((name, idx) => ({
    id: uuidv4(),
    index: idx,
    name,
    status: idx === 0 ? 'active' : 'pending',
    notes: '',
    confirmed: false,
    attachments: [],
  }));
}

function deriveStatus(stages: Stage[]): ProjectStatus {
  if (stages.every((s) => s.confirmed)) return '已完成';
  if (stages.some((s) => s.status === 'completed' && !s.confirmed)) return '待确认';
  return '进行中';
}

function computeFiltered(
  projects: Project[],
  query: string,
  filterStatus: FilterStatus,
  sortType: SortType,
): Project[] {
  let result = projects;
  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.clientEmail.toLowerCase().includes(q),
    );
  }
  if (filterStatus !== '全部') {
    result = result.filter((p) => p.status === filterStatus);
  }
  const sorted = [...result];
  switch (sortType) {
    case '按截止日期':
      sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
      break;
    case '按创建时间':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case '按预算':
      sorted.sort((a, b) => b.budget - a.budget);
      break;
  }
  return sorted;
}

function computeStats(projects: Project[]) {
  const total = projects.length;
  const pending = projects.filter((p) => p.status === '待确认').length;
  const avgBudget = total === 0 ? 0 : Math.round(projects.reduce((s, p) => s + p.budget, 0) / total);
  return { total, pending, avgBudget };
}

export interface AppState {
  projects: Project[];
  searchQuery: string;
  filterStatus: FilterStatus;
  sortType: SortType;
  selectedProjectId: string | null;
  filteredProjects: Project[];
  stats: { total: number; pending: number; avgBudget: number };
  createProject: (input: CreateProjectInput) => void;
  deleteProject: (id: string) => void;
  updateStageNotes: (projectId: string, stageId: string, notes: string) => void;
  addAttachment: (projectId: string, stageId: string, attachment: Attachment) => void;
  removeAttachment: (projectId: string, stageId: string, attachmentId: string) => void;
  confirmStage: (projectId: string, stageId: string) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (s: FilterStatus) => void;
  setSortType: (s: SortType) => void;
  selectProject: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialProjects = loadProjects();
  return {
    projects: initialProjects,
    searchQuery: '',
    filterStatus: '全部',
    sortType: '按截止日期',
    selectedProjectId: null,
    filteredProjects: computeFiltered(initialProjects, '', '全部', '按截止日期'),
    stats: computeStats(initialProjects),

    createProject: (input) => {
      const proj: Project = {
        id: uuidv4(),
        name: input.name,
        clientEmail: input.clientEmail,
        budget: input.budget,
        deadline: input.deadline,
        projectType: input.projectType,
        status: '进行中',
        createdAt: new Date().toISOString(),
        stages: createStages(),
      };
      const projects = [proj, ...get().projects];
      saveProjects(projects);
      set({
        projects,
        filteredProjects: computeFiltered(projects, get().searchQuery, get().filterStatus, get().sortType),
        stats: computeStats(projects),
      });
    },

    deleteProject: (id) => {
      const projects = get().projects.filter((p) => p.id !== id);
      saveProjects(projects);
      set({
        projects,
        selectedProjectId: get().selectedProjectId === id ? null : get().selectedProjectId,
        filteredProjects: computeFiltered(projects, get().searchQuery, get().filterStatus, get().sortType),
        stats: computeStats(projects),
      });
    },

    updateStageNotes: (projectId, stageId, notes) => {
      const projects = get().projects.map((p) => {
        if (p.id !== projectId) return p;
        const stages = p.stages.map((s) => (s.id === stageId ? { ...s, notes } : s));
        return { ...p, stages };
      });
      saveProjects(projects);
      set({
        projects,
        filteredProjects: computeFiltered(projects, get().searchQuery, get().filterStatus, get().sortType),
      });
    },

    addAttachment: (projectId, stageId, attachment) => {
      const projects = get().projects.map((p) => {
        if (p.id !== projectId) return p;
        const stages = p.stages.map((s) =>
          s.id === stageId ? { ...s, attachments: [...s.attachments, attachment].slice(0, 5) } : s,
        );
        return { ...p, stages };
      });
      saveProjects(projects);
      set({
        projects,
        filteredProjects: computeFiltered(projects, get().searchQuery, get().filterStatus, get().sortType),
      });
    },

    removeAttachment: (projectId, stageId, attachmentId) => {
      const projects = get().projects.map((p) => {
        if (p.id !== projectId) return p;
        const stages = p.stages.map((s) =>
          s.id === stageId ? { ...s, attachments: s.attachments.filter((a) => a.id !== attachmentId) } : s,
        );
        return { ...p, stages };
      });
      saveProjects(projects);
      set({
        projects,
        filteredProjects: computeFiltered(projects, get().searchQuery, get().filterStatus, get().sortType),
      });
    },

    confirmStage: (projectId, stageId) => {
      const projects = get().projects.map((p) => {
        if (p.id !== projectId) return p;
        const stages = p.stages.map((s, idx) => {
          if (s.id === stageId) {
            return { ...s, confirmed: true, status: 'completed' as const };
          }
          const current = p.stages.find((st) => st.id === stageId);
          if (!current) return s;
          if (idx === current.index + 1 && !s.confirmed && s.status === 'pending') {
            return { ...s, status: 'active' as const };
          }
          return s;
        });
        return { ...p, stages, status: deriveStatus(stages) };
      });
      saveProjects(projects);
      set({
        projects,
        filteredProjects: computeFiltered(projects, get().searchQuery, get().filterStatus, get().sortType),
        stats: computeStats(projects),
      });
    },

    setSearchQuery: (q) => {
      set({
        searchQuery: q,
        filteredProjects: computeFiltered(get().projects, q, get().filterStatus, get().sortType),
      });
    },

    setFilterStatus: (s) => {
      set({
        filterStatus: s,
        filteredProjects: computeFiltered(get().projects, get().searchQuery, s, get().sortType),
      });
    },

    setSortType: (s) => {
      set({
        sortType: s,
        filteredProjects: computeFiltered(get().projects, get().searchQuery, get().filterStatus, s),
      });
    },

    selectProject: (id) => set({ selectedProjectId: id }),
  };
});
