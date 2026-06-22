import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Project, Page, Hotspot, PALETTE } from '../types';
import { dbGetAll, dbPut, dbDelete } from '../utils/db';
import { getRandomPaletteColor } from '../utils/canvas';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentPageIndex: number;
  selectedHotspotId: string | null;
  isPlaying: boolean;
  playbackDuration: number;
  sidebarOpen: boolean;
  isMobilePanelOpen: boolean;

  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string, coverColor: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  setCurrentPageIndex: (index: number) => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  setPageImage: (pageId: string, imageUrl: string, imageWidth: number, imageHeight: number) => void;
  addHotspot: (pageId: string, x: number, y: number, width: number, height: number) => void;
  updateHotspot: (pageId: string, hotspotId: string, updates: Partial<Hotspot>) => void;
  removeHotspot: (pageId: string, hotspotId: string) => void;
  setSelectedHotspotId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackDuration: (duration: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobilePanelOpen: (open: boolean) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  persistCurrentProject: () => Promise<void>;
}

const MAX_HOTSPOTS = 50;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentPageIndex: 0,
  selectedHotspotId: null,
  isPlaying: false,
  playbackDuration: 5,
  sidebarOpen: true,
  isMobilePanelOpen: false,

  loadProjects: async () => {
    const projects = await dbGetAll<Project>();
    projects.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ projects });
  },

  createProject: async (name, description, coverColor) => {
    const firstPageId = uuidv4();
    const project: Project = {
      id: uuidv4(),
      name,
      description,
      coverColor,
      pages: [
        {
          id: firstPageId,
          pageNumber: 1,
          imageUrl: '',
          imageWidth: 0,
          imageHeight: 0,
          hotspots: [],
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbPut(project);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  deleteProject: async (id) => {
    await dbDelete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  openProject: async (id) => {
    const projects = get().projects;
    const project = projects.find((p) => p.id === id);
    if (project) {
      set({ currentProject: project, currentPageIndex: 0, selectedHotspotId: null });
    }
  },

  closeProject: () => {
    set({ currentProject: null, currentPageIndex: 0, selectedHotspotId: null, isPlaying: false });
  },

  setCurrentPageIndex: (index) => {
    set({ currentPageIndex: index, selectedHotspotId: null });
  },

  addPage: () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const newPage: Page = {
      id: uuidv4(),
      pageNumber: currentProject.pages.length + 1,
      imageUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      hotspots: [],
    };
    const updated: Project = {
      ...currentProject,
      pages: [...currentProject.pages, newPage],
      updatedAt: Date.now(),
    };
    set({ currentProject: updated });
    get().persistCurrentProject();
    get().loadProjects();
  },

  removePage: (pageId) => {
    const { currentProject } = get();
    if (!currentProject || currentProject.pages.length <= 1) return;
    const updatedPages = currentProject.pages
      .filter((p) => p.id !== pageId)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }));
    const updated: Project = {
      ...currentProject,
      pages: updatedPages,
      updatedAt: Date.now(),
    };
    set({ currentProject: updated, currentPageIndex: 0, selectedHotspotId: null });
    get().persistCurrentProject();
    get().loadProjects();
  },

  setPageImage: (pageId, imageUrl, imageWidth, imageHeight) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const updated: Project = {
      ...currentProject,
      pages: currentProject.pages.map((p) =>
        p.id === pageId ? { ...p, imageUrl, imageWidth, imageHeight } : p
      ),
      updatedAt: Date.now(),
    };
    set({ currentProject: updated });
    get().persistCurrentProject();
  },

  addHotspot: (pageId, x, y, width, height) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const page = currentProject.pages.find((p) => p.id === pageId);
    if (!page) return;
    if (page.hotspots.length >= MAX_HOTSPOTS) return;
    const newHotspot: Hotspot = {
      id: uuidv4(),
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(Math.max(width, 20)),
      height: Math.round(Math.max(height, 20)),
      color: getRandomPaletteColor(),
      label: '角色',
      actionType: 'popup',
      popupText: '',
      animationType: 'fadeInOut',
    };
    const updated: Project = {
      ...currentProject,
      pages: currentProject.pages.map((p) =>
        p.id === pageId ? { ...p, hotspots: [...p.hotspots, newHotspot] } : p
      ),
      updatedAt: Date.now(),
    };
    set({ currentProject: updated, selectedHotspotId: newHotspot.id });
    get().persistCurrentProject();
  },

  updateHotspot: (pageId, hotspotId, updates) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const updated: Project = {
      ...currentProject,
      pages: currentProject.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              hotspots: p.hotspots.map((h) => (h.id === hotspotId ? { ...h, ...updates } : h)),
            }
          : p
      ),
      updatedAt: Date.now(),
    };
    set({ currentProject: updated });
    get().persistCurrentProject();
  },

  removeHotspot: (pageId, hotspotId) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const updated: Project = {
      ...currentProject,
      pages: currentProject.pages.map((p) =>
        p.id === pageId ? { ...p, hotspots: p.hotspots.filter((h) => h.id !== hotspotId) } : p
      ),
      updatedAt: Date.now(),
    };
    set({ currentProject: updated, selectedHotspotId: null });
    get().persistCurrentProject();
  },

  setSelectedHotspotId: (id) => set({ selectedHotspotId: id }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setPlaybackDuration: (duration) => set({ playbackDuration: duration }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setIsMobilePanelOpen: (open) => set({ isMobilePanelOpen: open }),

  reorderPages: (fromIndex, toIndex) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const pages = [...currentProject.pages];
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);
    const renumbered = pages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    const updated: Project = { ...currentProject, pages: renumbered, updatedAt: Date.now() };
    set({ currentProject: updated, currentPageIndex: toIndex });
    get().persistCurrentProject();
  },

  persistCurrentProject: async () => {
    const { currentProject, projects } = get();
    if (!currentProject) return;
    await dbPut(currentProject);
    set({
      projects: projects.map((p) => (p.id === currentProject.id ? currentProject : p)),
    });
  },
}));
