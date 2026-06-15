import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectSnapshot, ActiveTimeSegment } from '@/types';
import { startActiveSegment, endActiveSegment, calculateActiveSeconds } from '@/utils/time';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'currentRow' | 'elapsedSeconds' | 'undoStack' | 'activeSegments'>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  setCurrentProject: (id: string | null) => void;
  advanceRow: (id: string) => Promise<void>;
  undo: (id: string) => Promise<void>;
  startActiveSession: (id: string) => Promise<void>;
  endActiveSession: (id: string) => Promise<void>;
  getActiveSeconds: (id: string) => number;
}

const MAX_UNDO_STEPS = 5;

function createSnapshot(p: Project): ProjectSnapshot {
  return {
    name: p.name,
    yarnColor: p.yarnColor,
    stitchCount: p.stitchCount,
    rowCount: p.rowCount,
    referenceImage: p.referenceImage,
    patternText: p.patternText,
    currentRow: p.currentRow,
    elapsedSeconds: p.elapsedSeconds,
    activeSegments: p.activeSegments.map((s) => ({ ...s })),
  };
}

function applySnapshot(p: Project, snapshot: ProjectSnapshot): Project {
  return {
    ...p,
    name: snapshot.name,
    yarnColor: snapshot.yarnColor,
    stitchCount: snapshot.stitchCount,
    rowCount: snapshot.rowCount,
    referenceImage: snapshot.referenceImage,
    patternText: snapshot.patternText,
    currentRow: snapshot.currentRow,
    elapsedSeconds: snapshot.elapsedSeconds,
    activeSegments: snapshot.activeSegments.map((s) => ({ ...s })),
  };
}

function pushUndoStack(p: Project, snapshot: ProjectSnapshot): ProjectSnapshot[] {
  const stack = [...p.undoStack, snapshot];
  while (stack.length > MAX_UNDO_STEPS) {
    stack.shift();
  }
  return stack;
}

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
        const raw = (await idbGet(key)) as Record<string, unknown> | undefined;
        if (raw) {
          const project: Project = {
            id: raw.id as string,
            name: raw.name as string,
            yarnColor: raw.yarnColor as string,
            stitchCount: raw.stitchCount as number,
            rowCount: raw.rowCount as number,
            referenceImage: raw.referenceImage as string | undefined,
            patternText: raw.patternText as string,
            currentRow: (raw.currentRow as number) ?? 0,
            createdAt: raw.createdAt as number,
            updatedAt: raw.updatedAt as number,
            startTime: raw.startTime as number | undefined,
            elapsedSeconds: (raw.elapsedSeconds as number) ?? 0,
            activeSegments: (raw.activeSegments as ActiveTimeSegment[]) ?? [],
            undoStack: (raw.undoStack as ProjectSnapshot[]) ?? [],
          };
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
      activeSegments: [],
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
    console.log('[Store] advanceRow called, id:', id, 'found:', !!project, 'currentRow:', project?.currentRow);
    if (!project || project.currentRow >= project.rowCount) return;

    const snapshot = createSnapshot(project);
    const newUndoStack = pushUndoStack(project, snapshot);
    console.log('[Store] snapshot created, undoStack size:', newUndoStack.length);

    const updated: Project = {
      ...project,
      currentRow: project.currentRow + 1,
      undoStack: newUndoStack,
      updatedAt: Date.now(),
    };

    console.log('[Store] saving to IDB and updating state, new currentRow:', updated.currentRow);
    await idbSet(`project_${id}`, updated);
    set((state) => {
      const newProjects = state.projects.map((p) => (p.id === id ? updated : p));
      console.log('[Store] setState called, newProjects[0].currentRow:', newProjects[0]?.currentRow);
      return { projects: newProjects };
    });
  },

  undo: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project || project.undoStack.length === 0) return;

    const newUndoStack = [...project.undoStack];
    const snapshot = newUndoStack.pop()!;

    let restored = applySnapshot(project, snapshot);
    restored.undoStack = newUndoStack;
    restored.updatedAt = Date.now();

    await idbSet(`project_${id}`, restored);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? restored : p)),
    }));
  },

  startActiveSession: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const now = Date.now();
    const newSegments = startActiveSegment(project.activeSegments, now);

    const updated: Project = {
      ...project,
      activeSegments: newSegments,
      startTime: project.startTime ?? now,
      updatedAt: now,
    };

    await idbSet(`project_${id}`, updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  endActiveSession: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const now = Date.now();
    const newSegments = endActiveSegment(project.activeSegments, now);
    const totalActive = calculateActiveSeconds(newSegments, now);

    const updated: Project = {
      ...project,
      activeSegments: newSegments,
      elapsedSeconds: totalActive,
      updatedAt: now,
    };

    await idbSet(`project_${id}`, updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  getActiveSeconds: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return 0;
    return calculateActiveSeconds(project.activeSegments, Date.now());
  },
}));
