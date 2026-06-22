import { create } from 'zustand';
import type { Resume } from '@/types';
import { resumeService } from '@/modules/resume/services/resumeService';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  error: string | null;

  fetchResumes: () => Promise<void>;
  fetchResume: (id: string) => Promise<void>;
  createResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Resume>;
  updateResume: (id: string, resume: Partial<Resume>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  isLoading: false,
  error: null,

  fetchResumes: async () => {
    set({ isLoading: true, error: null });
    try {
      const resumes = await resumeService.getAll();
      set({ resumes, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchResume: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const resume = await resumeService.getById(id);
      set({ currentResume: resume, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createResume: async (resume) => {
    set({ isLoading: true, error: null });
    try {
      const created = await resumeService.create(resume);
      set((state) => ({
        resumes: [...state.resumes, created],
        currentResume: created,
        isLoading: false,
      }));
      return created;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateResume: async (id: string, resume: Partial<Resume>) => {
    set({ error: null });
    try {
      const updated = await resumeService.update(id, resume);
      set((state) => ({
        resumes: state.resumes.map((r) => (r.id === id ? updated : r)),
        currentResume: state.currentResume?.id === id ? updated : state.currentResume,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteResume: async (id: string) => {
    set({ error: null });
    try {
      await resumeService.delete(id);
      set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
        currentResume: state.currentResume?.id === id ? null : state.currentResume,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume });
  },
}));
