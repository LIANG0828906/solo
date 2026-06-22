import axios from 'axios';
import type { Resume } from '@/types';
import { ResumeHistoryManager } from '@/hooks/useHistory';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const historyManagerMap = new Map<string, ResumeHistoryManager<Resume>>();

function getHistoryManager(resumeId: string): ResumeHistoryManager<Resume> {
  if (!historyManagerMap.has(resumeId)) {
    throw new Error(`History manager not initialized for resume: ${resumeId}`);
  }
  return historyManagerMap.get(resumeId)!;
}

export const resumeService = {
  async getAll(): Promise<Resume[]> {
    const { data } = await api.get<Resume[]>('/resumes');
    return data;
  },

  async getById(id: string): Promise<Resume> {
    const { data } = await api.get<Resume>(`/resumes/${id}`);
    return data;
  },

  async create(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resume> {
    const { data } = await api.post<Resume>('/resumes', resume);
    return data;
  },

  async update(id: string, resume: Partial<Resume>): Promise<Resume> {
    const { data } = await api.put<Resume>(`/resumes/${id}`, resume);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/resumes/${id}`);
  },

  initHistory(resumeId: string, initialState: Resume, maxHistory: number = 50): void {
    if (!historyManagerMap.has(resumeId)) {
      historyManagerMap.set(resumeId, new ResumeHistoryManager<Resume>(initialState, maxHistory));
    }
  },

  pushSnapshot(resumeId: string, nextState: Resume): void {
    const manager = getHistoryManager(resumeId);
    manager.pushSnapshot(nextState);
  },

  undo(resumeId: string): Resume | null {
    const manager = getHistoryManager(resumeId);
    return manager.undo();
  },

  redo(resumeId: string): Resume | null {
    const manager = getHistoryManager(resumeId);
    return manager.redo();
  },

  canUndo(resumeId: string): boolean {
    const manager = historyManagerMap.get(resumeId);
    return manager?.canUndo ?? false;
  },

  canRedo(resumeId: string): boolean {
    const manager = historyManagerMap.get(resumeId);
    return manager?.canRedo ?? false;
  },

  resetHistory(resumeId: string, initialState: Resume): void {
    const manager = historyManagerMap.get(resumeId);
    if (manager) {
      manager.reset(initialState);
    } else {
      historyManagerMap.set(resumeId, new ResumeHistoryManager<Resume>(initialState));
    }
  },

  disposeHistory(resumeId: string): void {
    historyManagerMap.delete(resumeId);
  },
};
