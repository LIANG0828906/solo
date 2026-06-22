import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../../types';
import { ProjectDB, CommentDB, LikeDB } from '../../utils/db';
import { CURRENT_USER } from '../../types';

interface ProjectStoreState {
  projects: Project[];
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  addProject: (data: {
    title: string;
    description: string;
    images: string[];
  }) => Promise<Project>;
  updateProject: (
    id: string,
    data: Partial<Pick<Project, 'title' | 'description' | 'images'>>
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
  getProjectStats: (projectId: string) => Promise<{
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
  }>;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await ProjectDB.getAll();
      set({ projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ isLoading: false });
    }
  },

  addProject: async (data) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      images: data.images,
      author: CURRENT_USER,
      createdAt: now,
      updatedAt: now,
    };
    await ProjectDB.add(project);
    set((state) => ({
      projects: [project, ...state.projects],
    }));
    return project;
  },

  updateProject: async (id, data) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const updated: Project = {
      ...project,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await ProjectDB.update(updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    await ProjectDB.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },

  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  getProjectStats: async (projectId: string) => {
    const [likes, comments] = await Promise.all([
      LikeDB.getByProjectId(projectId),
      CommentDB.getByProjectId(projectId),
    ]);
    return {
      likeCount: likes.length,
      commentCount: comments.length,
      isLikedByCurrentUser: likes.some((l) => l.user === CURRENT_USER),
    };
  },
}));
