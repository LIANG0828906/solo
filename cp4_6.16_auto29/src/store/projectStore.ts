import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'currentRow' | 'elapsedSeconds' | 'undoStack'>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  setCurrentProject: (id: string | null) => void;
  advanceRow: (id: string) => Promise<void>;
  undoRow: (id: string) => Promise<void>;
  updateElapsedTime: (id: string, seconds: number) => Promise<void>;
  startReading: (id: string) => Promise<void>;
}

const MAX_UNDO_STEPS = 5;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: true,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const allKeys = await idbKeys();
      const projectKeys = allKeys.filter((k) => String(k).startsWith('project_'));
      const projects: Project[] = [];
      for (const key of projectKeys) {
        const project = await idbGet(key) as Project | undefined;
        if (project) {
          projects.push(project);
        }
      }
      projects.sort((a, b) => b.updatedAt - a.updatedAt);
      set({ projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    const now = Date.now();
    const newProject: Project = {
      ...data,
      id: uuidv4(),
      currentRow: 0,
      elapsedSeconds: 0,
      undoStack: [],
      createdAt: now,
      updatedAt: now,
    };
    await idbSet(`project_${newProject.id}`, newProject);
    set((state) => ({
      projects: [newProject, ...state.projects],
    }));
    return newProject;
  },

  deleteProject: async (id) => {
    await idbDel(`project_${id}`);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    }));
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  setCurrentProject: (id) => {
    set({ currentProjectId: id });
  },

  advanceRow: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project || project.currentRow >= project.rowCount) return;

    const newUndoStack = [...project.undoStack, project.currentRow];
    if (newUndoStack.length > MAX_UNDO_STEPS) {
      newUndoStack.shift();
    }

    const updated: Project = {
      ...project,
      currentRow: project.currentRow + 1,
      undoStack: newUndoStack,
      updatedAt: Date.now(),
    };

    await idbSet(`project_${id}`, updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  undoRow: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project || project.undoStack.length === 0) return;

    const newUndoStack = [...project.undoStack];
    const previousRow = newUndoStack.pop()!;

    const updated: Project = {
      ...project,
      currentRow: previousRow,
      undoStack: newUndoStack,
      updatedAt: Date.now(),
    };

    await idbSet(`project_${id}`, updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  updateElapsedTime: async (id, seconds) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const updated: Project = {
      ...project,
      elapsedSeconds: seconds,
      updatedAt: Date.now(),
    };

    await idbSet(`project_${id}`, updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  startReading: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const updated: Project = {
      ...project,
      startTime: project.startTime ?? Date.now(),
      updatedAt: Date.now(),
    };

    await idbSet(`project_${id}`, updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },
}));
