import { create } from 'zustand';
import { Fabric, Project, LayoutCell, FabricUsage, User } from '../types';
import { fetchFabrics } from '../api/fabricApi';
import {
  createProject,
  updateProject,
  fetchProjects,
  fetchProjectById,
} from '../api/projectApi';

interface ProjectStore {
  user: User | null;
  fabrics: Fabric[];
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;

  setUser: (user: User | null) => void;
  loadFabrics: () => Promise<void>;
  loadProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  loadProject: (id: number) => Promise<void>;
  createNewProject: (data: {
    name: string;
    widthCm: number;
    heightCm: number;
    gridCols?: number;
    gridRows?: number;
  }) => Promise<Project>;
  setCell: (index: number, fabricId: number | null) => void;
  swapCells: (fromIndex: number, toIndex: number) => void;
  clearAllCells: () => void;
  saveCurrentProject: () => Promise<void>;
  calculateUsage: () => { totalCost: number; fabricUsage: FabricUsage[] };
  setError: (error: string | null) => void;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

const createEmptyLayout = (cols: number, rows: number): LayoutCell[] => {
  return Array(cols * rows)
    .fill(null)
    .map(() => ({ fabricId: null }));
};

let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  user: null,
  fabrics: [],
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  isSaving: false,
  lastSaved: null,
  autoSaveEnabled: true,

  setUser: (user) => set({ user }),

  startAutoSave: () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }
    autoSaveInterval = setInterval(async () => {
      const state = get();
      if (state.autoSaveEnabled && state.currentProject) {
        try {
          await state.saveCurrentProject();
        } catch (err) {
          console.error('自动保存失败:', err);
        }
      }
    }, 30000);
  },

  stopAutoSave: () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  },

  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

  loadFabrics: async () => {
    try {
      set({ isLoading: true });
      const fabrics = await fetchFabrics();
      set({ fabrics, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || '加载布料失败', isLoading: false });
    }
  },

  loadProjects: async () => {
    try {
      set({ isLoading: true });
      const projects = await fetchProjects();
      set({ projects, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || '加载项目失败', isLoading: false });
    }
  },

  loadProject: async (id: number) => {
    try {
      set({ isLoading: true });
      const project = await fetchProjectById(id);
      set({ currentProject: project, isLoading: false, lastSaved: new Date() });
      get().startAutoSave();
    } catch (err: any) {
      set({ error: err.message || '加载项目失败', isLoading: false });
    }
  },

  createNewProject: async (data) => {
    const gridCols = data.gridCols || 20;
    const gridRows = data.gridRows || 20;
    const layout = createEmptyLayout(gridCols, gridRows);
    const project = await createProject({
      name: data.name,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      gridCols,
      gridRows,
      layout,
      totalCost: 0,
      fabricUsage: [],
    });
    set((state) => ({
      currentProject: project,
      projects: [project, ...state.projects],
      lastSaved: new Date(),
    }));
    get().startAutoSave();
    return project;
  },

  setCurrentProject: (project) => {
    set({ currentProject: project, lastSaved: project ? new Date() : null });
    if (project) {
      get().startAutoSave();
    } else {
      get().stopAutoSave();
    }
  },

  setCell: (index, fabricId) => {
    set((state) => {
      if (!state.currentProject) return state;
      const newLayout = [...state.currentProject.layout];
      newLayout[index] = { fabricId };
      return {
        currentProject: { ...state.currentProject, layout: newLayout },
      };
    });
  },

  swapCells: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.currentProject) return state;
      const newLayout = [...state.currentProject.layout];
      const temp = newLayout[fromIndex];
      newLayout[fromIndex] = newLayout[toIndex];
      newLayout[toIndex] = temp;
      return {
        currentProject: { ...state.currentProject, layout: newLayout },
      };
    });
  },

  clearAllCells: () => {
    set((state) => {
      if (!state.currentProject) return state;
      const newLayout = createEmptyLayout(
        state.currentProject.gridCols,
        state.currentProject.gridRows
      );
      return {
        currentProject: { ...state.currentProject, layout: newLayout },
      };
    });
  },

  calculateUsage: () => {
    const state = get();
    const project = state.currentProject;
    const fabrics = state.fabrics;
    if (!project) return { totalCost: 0, fabricUsage: [] };

    const cellWidthM = project.widthCm / 100 / project.gridCols;
    const cellHeightM = project.heightCm / 100 / project.gridRows;
    const cellAreaM2 = cellWidthM * cellHeightM;

    const countMap = new Map<number, number>();
    for (const cell of project.layout) {
      if (cell.fabricId !== null) {
        countMap.set(cell.fabricId, (countMap.get(cell.fabricId) || 0) + 1);
      }
    }

    const fabricUsage: FabricUsage[] = [];
    let totalCost = 0;

    for (const [fabricId, cellCount] of countMap.entries()) {
      const fabric = fabrics.find((f) => f.id === fabricId);
      if (!fabric) continue;
      const areaM2 = cellCount * cellAreaM2;
      const metersNeeded = areaM2 / fabric.width;
      const cost = metersNeeded * fabric.pricePerMeter;
      totalCost += cost;
      fabricUsage.push({ fabricId, cellCount, areaM2, cost });
    }

    return { totalCost, fabricUsage };
  },

  saveCurrentProject: async () => {
    const state = get();
    if (!state.currentProject) return;

    set({ isSaving: true });
    const { totalCost, fabricUsage } = state.calculateUsage();

    try {
      const updated = await updateProject(state.currentProject.id, {
        layout: state.currentProject.layout,
        totalCost: Number(totalCost.toFixed(2)),
        fabricUsage,
        name: state.currentProject.name,
        widthCm: state.currentProject.widthCm,
        heightCm: state.currentProject.heightCm,
        gridCols: state.currentProject.gridCols,
        gridRows: state.currentProject.gridRows,
      });
      set((s) => ({
        currentProject: updated,
        projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
        isSaving: false,
        lastSaved: new Date(),
      }));
    } catch (err: any) {
      set({ error: err.message || '保存项目失败', isSaving: false });
      throw err;
    }
  },

  setError: (error) => set({ error }),
}));
