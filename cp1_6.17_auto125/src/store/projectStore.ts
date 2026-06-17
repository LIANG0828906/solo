import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Step, ProjectStore } from '../types';

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('获取项目列表失败');
      const data: Project[] = await res.json();
      set({ projects: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误', loading: false });
    }
  },

  createProject: async (name: string, coverDescription: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, coverDescription })
      });
      if (!res.ok) throw new Error('创建项目失败');
      const newProject: Project = await res.json();
      set((state) => ({ projects: [newProject, ...state.projects] }));
      return newProject;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建项目失败' });
      return null;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('更新项目失败');
      const updated: Project = await res.json();
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p))
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新项目失败' });
      return null;
    }
  },

  deleteProject: async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除项目失败');
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除项目失败' });
      return false;
    }
  },

  addStep: async (projectId: string, stepData: Omit<Step, 'id' | 'createdAt'>) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    const newStep: Step = {
      ...stepData,
      id: uuidv4(),
      createdAt: Date.now()
    };

    const updatedSteps = [...project.steps, newStep];
    await get().updateProject(projectId, { steps: updatedSteps });
  },

  updateStep: async (projectId: string, stepId: string, data: Partial<Step>) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedSteps = project.steps.map((s) =>
      s.id === stepId ? { ...s, ...data } : s
    );
    await get().updateProject(projectId, { steps: updatedSteps });
  },

  deleteStep: async (projectId: string, stepId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedSteps = project.steps.filter((s) => s.id !== stepId);
    await get().updateProject(projectId, { steps: updatedSteps });
  },

  reorderSteps: async (projectId: string, stepIds: string[]) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    const stepMap = new Map(project.steps.map((s) => [s.id, s]));
    const updatedSteps = stepIds
      .map((id) => stepMap.get(id))
      .filter((s): s is Step => s !== undefined);

    await get().updateProject(projectId, { steps: updatedSteps });
  },

  getProjectById: (id: string) => {
    return get().projects.find((p) => p.id === id);
  }
}));
