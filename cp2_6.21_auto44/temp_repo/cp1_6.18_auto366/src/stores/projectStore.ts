import { create } from 'zustand';
import type { Project, Note, MindMapData, Comment } from '../types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  notes: Note[];
  mindMapData: MindMapData;
  comments: Comment[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (title: string, description: string) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  fetchNotes: (projectId: string) => Promise<void>;
  createNote: (projectId: string, excerpt: string, reflection: string, tags: string[]) => Promise<Note>;
  updateNote: (noteId: string, data: Partial<Pick<Note, 'excerpt' | 'reflection' | 'tags'>>) => Promise<void>;
  fetchMindMap: (projectId: string) => Promise<void>;
  updateMindMap: (projectId: string, data: MindMapData) => Promise<void>;
  fetchComments: (projectId: string) => Promise<void>;
  createComment: (projectId: string, content: string) => Promise<Comment>;
  likeProject: (projectId: string) => Promise<number>;
}

const API_BASE = '/api';

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  notes: [],
  mindMapData: { nodes: [], edges: [] },
  comments: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      set({ projects: data, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  createProject: async (title, description) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    set((state) => ({
      projects: [data, ...state.projects],
      currentProject: data,
      loading: false,
    }));
    return data;
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  fetchNotes: async (projectId) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/projects/${projectId}/notes`);
    const data = await res.json();
    set({ notes: data, loading: false });
  },

  createNote: async (projectId, excerpt, reflection, tags) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/projects/${projectId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excerpt, reflection, tags }),
    });
    const data = await res.json();
    set((state) => ({
      notes: [data, ...state.notes],
      loading: false,
    }));
    return data;
  },

  updateNote: async (noteId, data) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? updated : n)),
      loading: false,
    }));
  },

  fetchMindMap: async (projectId) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/projects/${projectId}/mindmap`);
    const data = await res.json();
    set({ mindMapData: data, loading: false });
  },

  updateMindMap: async (projectId, data) => {
    set({ loading: true, error: null });
    await fetch(`${API_BASE}/projects/${projectId}/mindmap`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    set({ mindMapData: data, loading: false });
  },

  fetchComments: async (projectId) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/projects/${projectId}/comments`);
    const data = await res.json();
    set({ comments: data, loading: false });
  },

  createComment: async (projectId, content) => {
    set({ loading: true, error: null });
    const res = await fetch(`${API_BASE}/projects/${projectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    set((state) => ({
      comments: [data, ...state.comments],
      loading: false,
    }));
    return data;
  },

  likeProject: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/like`, {
      method: 'POST',
    });
    const data = await res.json();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, likes: data.likes } : p
      ),
      currentProject:
        state.currentProject && state.currentProject.id === projectId
          ? { ...state.currentProject, likes: data.likes }
          : state.currentProject,
    }));
    return data.likes;
  },
}));
