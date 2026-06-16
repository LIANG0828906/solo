import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectLog, Step, Material, MaterialUsage, DifficultyLevel } from '@/types';
import { db } from '@/utils/db';

interface ProjectStoreState {
  projects: ProjectLog[];
  materials: Material[];
  currentProjectId: string | null;
  isLoading: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  _persistProjects: () => Promise<void>;
  _persistMaterials: () => Promise<void>;

  createProject: (data: Partial<ProjectLog>) => Promise<string>;
  updateProject: (id: string, data: Partial<ProjectLog>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  markProjectCompleted: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;

  addStep: (projectId: string, step: Omit<Step, 'id' | 'order' | 'createdAt' | 'projectId'>) => Promise<void>;
  updateStep: (projectId: string, stepId: string, data: Partial<Step>) => Promise<void>;
  deleteStep: (projectId: string, stepId: string) => Promise<void>;
  reorderSteps: (projectId: string, fromIndex: number, toIndex: number) => Promise<void>;

  addMaterial: (data: Omit<Material, 'id' | 'createdAt'>) => Promise<string>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;

  addMaterialUsage: (projectId: string, usage: Omit<MaterialUsage, 'id' | 'projectId'>) => Promise<void>;
  removeMaterialUsage: (projectId: string, usageId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  materials: [],
  currentProjectId: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });
    try {
      const [projects, materials] = await Promise.all([
        db.getAllProjects(),
        db.getAllMaterials()
      ]);
      set({ projects, materials, isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  _persistProjects: async () => {
    const { projects } = get();
    for (const p of projects) {
      await db.saveProject(p);
    }
  },

  _persistMaterials: async () => {
    const { materials } = get();
    for (const m of materials) {
      await db.saveMaterial(m);
    }
  },

  createProject: async (data) => {
    const id = uuidv4();
    const newProject: ProjectLog = {
      id,
      title: data.title || '未命名作品',
      coverImage: data.coverImage,
      description: data.description || '',
      startDate: data.startDate || Date.now(),
      endDate: data.endDate,
      isCompleted: data.isCompleted || false,
      totalHours: data.totalHours || 0,
      steps: data.steps || [],
      materialUsages: data.materialUsages || []
    };
    set((s) => ({ projects: [newProject, ...s.projects], currentProjectId: id }));
    await db.saveProject(newProject);
    return id;
  },

  updateProject: async (id, data) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p))
    }));
    const updated = get().projects.find((p) => p.id === id);
    if (updated) await db.saveProject(updated);
  },

  deleteProject: async (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId
    }));
    await db.deleteProject(id);
  },

  markProjectCompleted: async (id) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, isCompleted: true, endDate: p.endDate || Date.now() } : p
      )
    }));
    const updated = get().projects.find((p) => p.id === id);
    if (updated) await db.saveProject(updated);
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  addStep: async (projectId, step) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const newStep: Step = {
          ...step,
          projectId,
          id: uuidv4(),
          order: p.steps.length,
          createdAt: Date.now()
        };
        return { ...p, steps: [...p.steps, newStep] };
      })
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) await db.saveProject(updated);
  },

  updateStep: async (projectId, stepId, data) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          steps: p.steps.map((st) => (st.id === stepId ? { ...st, ...data } : st))
        };
      })
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) await db.saveProject(updated);
  },

  deleteStep: async (projectId, stepId) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const filtered = p.steps.filter((st) => st.id !== stepId);
        filtered.forEach((st, idx) => (st.order = idx));
        return { ...p, steps: filtered };
      })
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) await db.saveProject(updated);
  },

  reorderSteps: async (projectId, fromIndex, toIndex) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const sorted = [...p.steps].sort((a, b) => a.order - b.order);
        const [moved] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, moved);
        sorted.forEach((st, idx) => (st.order = idx));
        return { ...p, steps: sorted };
      })
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) await db.saveProject(updated);
  },

  addMaterial: async (data) => {
    const id = uuidv4();
    const newMaterial: Material = {
      ...data,
      id,
      createdAt: Date.now()
    };
    set((s) => ({ materials: [newMaterial, ...s.materials] }));
    await db.saveMaterial(newMaterial);
    return id;
  },

  updateMaterial: async (id, data) => {
    set((s) => ({
      materials: s.materials.map((m) => (m.id === id ? { ...m, ...data } : m))
    }));
    const updated = get().materials.find((m) => m.id === id);
    if (updated) await db.saveMaterial(updated);
  },

  deleteMaterial: async (id) => {
    set((s) => ({ materials: s.materials.filter((m) => m.id !== id) }));
    await db.deleteMaterial(id);
  },

  addMaterialUsage: async (projectId, usage) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const newUsage: MaterialUsage = {
          ...usage,
          id: uuidv4(),
          projectId
        };
        return { ...p, materialUsages: [...p.materialUsages, newUsage] };
      })
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) await db.saveProject(updated);
  },

  removeMaterialUsage: async (projectId, usageId) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          materialUsages: p.materialUsages.filter((u) => u.id !== usageId)
        };
      })
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) await db.saveProject(updated);
  }
}));
