import { create } from 'zustand';
import type { Project, ProjectDetail, Note, Version, Member, DiffNote } from '../types';
import {
  fetchProjects,
  createProject as apiCreateProject,
  fetchProject,
  fetchVersions,
  createVersion as apiCreateVersion,
} from '../utils/api';

interface ProjectStore {
  projects: Project[];
  currentProject: ProjectDetail | null;
  notes: Note[];
  versions: Version[];
  members: Member[];
  diffs: DiffNote[];
  flashNoteIds: Set<string>;
  loading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  addProject: (project: Project) => void;
  createProject: (payload: {
    name: string;
    key: string;
    bpm: number;
    instruments: string[];
    creatorId: string;
    creatorName: string;
  }) => Promise<Project>;
  loadProject: (id: string) => Promise<void>;
  setCurrentProject: (project: ProjectDetail | null) => void;
  setNotes: (notes: Note[]) => void;
  upsertNote: (note: Note, flash?: boolean) => void;
  deleteNote: (noteId: string) => void;
  loadVersions: (projectId: string) => Promise<void>;
  addVersion: (version: Version) => void;
  createVersion: (payload: {
    projectId: string;
    creatorId: string;
    creatorName: string;
  }) => Promise<Version | null>;
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  removeMember: (userId: string) => void;
  setDiffs: (diffs: DiffNote[]) => void;
  clearDiffs: () => void;
  addFlashNote: (noteId: string) => void;
  clearFlashNote: (noteId: string) => void;
  restoreVersion: (version: Version) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  notes: [],
  versions: [],
  members: [],
  diffs: [],
  flashNoteIds: new Set(),
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await fetchProjects();
      set({ projects, loading: false });
    } catch (e: any) {
      set({ error: e.message || '加载项目失败', loading: false });
    }
  },

  addProject: (project) => {
    set((state) => ({
      projects: [project, ...state.projects],
    }));
  },

  createProject: async (payload) => {
    set({ loading: true, error: null });
    try {
      const project = await apiCreateProject(payload);
      set((state) => ({
        projects: [project, ...state.projects],
        loading: false,
      }));
      return project;
    } catch (e: any) {
      set({ error: e.message || '创建项目失败', loading: false });
      throw e;
    }
  },

  loadProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await fetchProject(id);
      set({
        currentProject: project,
        notes: project.notes || [],
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || '加载项目失败', loading: false });
      throw e;
    }
  },

  setCurrentProject: (project) => {
    set({
      currentProject: project,
      notes: project?.notes || [],
    });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  upsertNote: (note, flash = true) => {
    set((state) => {
      const idx = state.notes.findIndex((n) => n.id === note.id);
      const newNotes = idx >= 0
        ? state.notes.map((n, i) => (i === idx ? note : n))
        : [...state.notes, note];
      const newFlash = new Set(state.flashNoteIds);
      if (flash) newFlash.add(note.id);
      return { notes: newNotes, flashNoteIds: newFlash };
    });
  },

  deleteNote: (noteId) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== noteId),
    }));
  },

  loadVersions: async (projectId) => {
    try {
      const versions = await fetchVersions(projectId);
      set({ versions });
    } catch (e: any) {
      set({ error: e.message || '加载版本失败' });
    }
  },

  addVersion: (version) => {
    set((state) => ({
      versions: [version, ...state.versions],
    }));
  },

  createVersion: async (payload) => {
    try {
      const { notes } = get();
      const version = await apiCreateVersion({
        projectId: payload.projectId,
        snapshot: notes,
        creatorId: payload.creatorId,
        creatorName: payload.creatorName,
      });
      set((state) => ({
        versions: [version, ...state.versions],
      }));
      return version;
    } catch (e: any) {
      set({ error: e.message || '创建版本失败' });
      return null;
    }
  },

  setMembers: (members) => {
    set({ members });
  },

  addMember: (member) => {
    set((state) => {
      const idx = state.members.findIndex((m) => m.id === member.id);
      if (idx >= 0) {
        return {
          members: state.members.map((m, i) => (i === idx ? member : m)),
        };
      }
      return { members: [...state.members, member] };
    });
  },

  removeMember: (userId) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== userId),
    }));
  },

  setDiffs: (diffs) => {
    set({ diffs });
  },

  clearDiffs: () => {
    set({ diffs: [] });
  },

  addFlashNote: (noteId) => {
    set((state) => {
      const newFlash = new Set(state.flashNoteIds);
      newFlash.add(noteId);
      return { flashNoteIds: newFlash };
    });
  },

  clearFlashNote: (noteId) => {
    set((state) => {
      const newFlash = new Set(state.flashNoteIds);
      newFlash.delete(noteId);
      return { flashNoteIds: newFlash };
    });
  },

  restoreVersion: (version) => {
    set({ notes: [...version.snapshot] });
  },

  setError: (error) => set({ error }),
}));
