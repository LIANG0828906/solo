import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { NavTab, Material, Project } from '@/types';
import { generateMaterials, generateSampleProjects } from '@/utils/mockData';

const initialMaterials = generateMaterials(50);
const initialProjects = generateSampleProjects(initialMaterials);

export interface AppState {
  sidebarCollapsed: boolean;
  activeTab: NavTab;
  materials: Material[];
  projects: Project[];
  likedProjects: Record<string, boolean>;

  toggleSidebar: () => void;
  setActiveTab: (tab: NavTab) => void;

  addMaterial: (m: Omit<Material, 'id' | 'notified' | 'initialQuantity'> & { initialQuantity?: number }) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  markNotified: (id: string) => void;

  addProject: (p: Omit<Project, 'id' | 'status' | 'progress' | 'createdAt' | 'completedAt'>) => void;
  updateProjectProgress: (id: string, progress: number) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleLike: (projectId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  activeTab: 'home',
  materials: initialMaterials,
  projects: initialProjects,
  likedProjects: {},

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addMaterial: (m) => {
    const newMat: Material = {
      ...m,
      id: uuidv4(),
      notified: false,
      initialQuantity: m.initialQuantity ?? m.quantity,
    };
    set(s => ({ materials: [newMat, ...s.materials] }));
  },

  updateMaterial: (id, patch) =>
    set(s => ({
      materials: s.materials.map(m => (m.id === id ? { ...m, ...patch } : m)),
    })),

  deleteMaterial: (id) =>
    set(s => ({ materials: s.materials.filter(m => m.id !== id) })),

  markNotified: (id) =>
    set(s => ({
      materials: s.materials.map(m => (m.id === id ? { ...m, notified: true } : m)),
    })),

  addProject: (p) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...p,
      id: uuidv4(),
      progress: 0,
      status: 'pending',
      createdAt: now,
      completedAt: null,
    };

    p.materials.forEach(pm => {
      const mat = get().materials.find(m => m.id === pm.materialId);
      if (mat) {
        get().updateMaterial(pm.materialId, {
          quantity: Math.max(0, mat.quantity - pm.usedQuantity),
        });
      }
    });

    set(s => ({ projects: [newProject, ...s.projects] }));
  },

  updateProjectProgress: (id, progress) => {
    const clamped = Math.max(0, Math.min(100, progress));
    set(s => ({
      projects: s.projects.map(p => {
        if (p.id !== id) return p;
        let status = p.status;
        let completedAt = p.completedAt;
        if (clamped >= 100) {
          status = 'completed';
          completedAt = completedAt ?? new Date().toISOString();
        } else if (clamped > 0) {
          status = 'in-progress';
        } else {
          status = 'pending';
        }
        return { ...p, progress: clamped, status, completedAt };
      }),
    }));
  },

  updateProject: (id, patch) =>
    set(s => ({
      projects: s.projects.map(p => (p.id === id ? { ...p, ...patch } : p)),
    })),

  deleteProject: (id) =>
    set(s => ({ projects: s.projects.filter(p => p.id !== id) })),

  toggleLike: (projectId) =>
    set(s => ({
      likedProjects: {
        ...s.likedProjects,
        [projectId]: !s.likedProjects[projectId],
      },
    })),
}));
