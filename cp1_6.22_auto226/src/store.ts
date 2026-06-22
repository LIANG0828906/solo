import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { FrameData, MarkData, ProjectData, ProjectMeta } from '@/types';
import { MarkManager } from '@/storage/MarkManager';

interface AppState {
  projects: ProjectMeta[];
  currentProjectId: string | null;
  frames: FrameData[];
  marks: Record<string, MarkData>;
  activeFrameId: string | null;
  searchQuery: string;
  ratingFilter: number;
  isExtracting: boolean;
  extractionProgress: number;
  extractionTotal: number;

  setProjects: (projects: ProjectMeta[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setFrames: (frames: FrameData[]) => void;
  setMarks: (marks: Record<string, MarkData>) => void;
  setActiveFrameId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setRatingFilter: (r: number) => void;
  setIsExtracting: (v: boolean) => void;
  setExtractionProgress: (p: number) => void;
  setExtractionTotal: (t: number) => void;

  addProject: (fileName: string, frames: FrameData[]) => void;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  saveMark: (mark: MarkData) => void;
  deleteMark: (frameId: string) => void;
  getFilteredFrames: () => FrameData[];
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: MarkManager.loadProjectMetas(),
  currentProjectId: null,
  frames: [],
  marks: {},
  activeFrameId: null,
  searchQuery: '',
  ratingFilter: 0,
  isExtracting: false,
  extractionProgress: 0,
  extractionTotal: 0,

  setProjects: (projects) => set({ projects }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setFrames: (frames) => set({ frames }),
  setMarks: (marks) => set({ marks }),
  setActiveFrameId: (id) => set({ activeFrameId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setRatingFilter: (r) => set({ ratingFilter: r }),
  setIsExtracting: (v) => set({ isExtracting: v }),
  setExtractionProgress: (p) => set({ extractionProgress: p }),
  setExtractionTotal: (t) => set({ extractionTotal: t }),

  addProject: (fileName, frames) => {
    const id = uuidv4();
    const project: ProjectData = {
      id,
      fileName,
      createdAt: Date.now(),
      frameCount: frames.length,
      markCount: 0,
      frameUrls: frames.map((f) => f.url),
      frameTimestamps: frames.map((f) => f.timestamp),
      marks: {},
    };
    MarkManager.saveProject(project);
    const projects = MarkManager.loadProjectMetas();
    set({
      projects,
      currentProjectId: id,
      frames,
      marks: {},
    });
  },

  loadProject: (projectId) => {
    const project = MarkManager.loadProject(projectId);
    if (!project) return;

    const frames: FrameData[] = project.frameUrls.map((url, i) => ({
      id: `${projectId}_${i}`,
      index: i,
      timestamp: project.frameTimestamps[i] ?? i * 2,
      blob: new Blob(),
      url,
    }));

    set({
      currentProjectId: projectId,
      frames,
      marks: project.marks,
    });
  },

  deleteProject: (projectId) => {
    MarkManager.deleteProject(projectId);
    const projects = MarkManager.loadProjectMetas();
    const state = get();
    if (state.currentProjectId === projectId) {
      set({
        projects,
        currentProjectId: null,
        frames: [],
        marks: {},
      });
    } else {
      set({ projects });
    }
  },

  saveMark: (mark) => {
    const state = get();
    const newMarks = { ...state.marks, [mark.frameId]: mark };
    set({ marks: newMarks });

    if (state.currentProjectId) {
      const project = MarkManager.loadProject(state.currentProjectId);
      if (project) {
        project.marks = newMarks;
        project.markCount = Object.keys(newMarks).length;
        MarkManager.saveProject(project);
        const projects = MarkManager.loadProjectMetas();
        set({ projects });
      }
    }
  },

  deleteMark: (frameId) => {
    const state = get();
    const newMarks = { ...state.marks };
    delete newMarks[frameId];
    set({ marks: newMarks });

    if (state.currentProjectId) {
      const project = MarkManager.loadProject(state.currentProjectId);
      if (project) {
        project.marks = newMarks;
        project.markCount = Object.keys(newMarks).length;
        MarkManager.saveProject(project);
        const projects = MarkManager.loadProjectMetas();
        set({ projects });
      }
    }
  },

  getFilteredFrames: () => {
    const state = get();
    let filtered = state.frames;

    if (state.ratingFilter > 0) {
      filtered = filtered.filter((f) => {
        const mark = state.marks[f.id];
        return mark && mark.rating === state.ratingFilter;
      });
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((f) => {
        const mark = state.marks[f.id];
        if (!mark) return false;
        const tagMatch = mark.tags.some((t) => t.name.toLowerCase().includes(q));
        const noteMatch = mark.note.toLowerCase().includes(q);
        return tagMatch || noteMatch;
      });
    }

    return filtered;
  },
}));
