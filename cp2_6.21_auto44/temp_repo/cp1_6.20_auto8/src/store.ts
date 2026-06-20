import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ResumeData, ApplicationRecord, ApplicationStatus } from './types';
import { createDefaultResume } from './types';

interface AppStore {
  resume: ResumeData;
  applications: ApplicationRecord[];
  activeTab: 'resume' | 'tracking';

  setResume: (data: Partial<ResumeData>) => void;
  addEducation: () => void;
  updateEducation: (id: string, data: Record<string, string>) => void;
  removeEducation: (id: string) => void;
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, data: Record<string, string>) => void;
  removeWorkExperience: (id: string) => void;
  addProjectExperience: () => void;
  updateProjectExperience: (id: string, data: Record<string, string>) => void;
  removeProjectExperience: (id: string) => void;
  reorderBlocks: (blockOrder: string[]) => void;
  setTemplate: (template: 'light' | 'dark') => void;

  addApplication: (companyName: string, positionName: string) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateApplicationNotes: (id: string, notes: string) => void;
  removeApplication: (id: string) => void;
  setActiveTab: (tab: 'resume' | 'tracking') => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {}
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const useStore = create<AppStore>((set, get) => ({
  resume: loadFromStorage<ResumeData>('resume_data', createDefaultResume()),
  applications: loadFromStorage<ApplicationRecord[]>('application_records', []),
  activeTab: 'resume',

  setResume: (data) => {
    const resume = { ...get().resume, ...data };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  addEducation: () => {
    const resume = {
      ...get().resume,
      education: [...get().resume.education, { id: uuidv4(), school: '', major: '', startDate: '', endDate: '' }],
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  updateEducation: (id, data) => {
    const resume = {
      ...get().resume,
      education: get().resume.education.map((e) => (e.id === id ? { ...e, ...data } : e)),
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  removeEducation: (id) => {
    const resume = {
      ...get().resume,
      education: get().resume.education.filter((e) => e.id !== id),
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  addWorkExperience: () => {
    const resume = {
      ...get().resume,
      workExperience: [...get().resume.workExperience, { id: uuidv4(), company: '', position: '', startDate: '', endDate: '', description: '' }],
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  updateWorkExperience: (id, data) => {
    const resume = {
      ...get().resume,
      workExperience: get().resume.workExperience.map((e) => (e.id === id ? { ...e, ...data } : e)),
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  removeWorkExperience: (id) => {
    const resume = {
      ...get().resume,
      workExperience: get().resume.workExperience.filter((e) => e.id !== id),
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  addProjectExperience: () => {
    const resume = {
      ...get().resume,
      projectExperience: [...get().resume.projectExperience, { id: uuidv4(), name: '', role: '', description: '' }],
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  updateProjectExperience: (id, data) => {
    const resume = {
      ...get().resume,
      projectExperience: get().resume.projectExperience.map((e) => (e.id === id ? { ...e, ...data } : e)),
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  removeProjectExperience: (id) => {
    const resume = {
      ...get().resume,
      projectExperience: get().resume.projectExperience.filter((e) => e.id !== id),
    };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  reorderBlocks: (blockOrder) => {
    const resume = { ...get().resume, blockOrder };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  setTemplate: (template) => {
    const resume = { ...get().resume, template };
    saveToStorage('resume_data', resume);
    set({ resume });
  },

  addApplication: (companyName, positionName) => {
    const record: ApplicationRecord = {
      id: uuidv4(),
      companyName,
      positionName,
      status: 'applied',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    };
    const applications = [record, ...get().applications];
    saveToStorage('application_records', applications);
    set({ applications });
  },

  updateApplicationStatus: (id, status) => {
    const applications = get().applications.map((a) => (a.id === id ? { ...a, status } : a));
    saveToStorage('application_records', applications);
    set({ applications });
  },

  updateApplicationNotes: (id, notes) => {
    const applications = get().applications.map((a) => (a.id === id ? { ...a, notes } : a));
    saveToStorage('application_records', applications);
    set({ applications });
  },

  removeApplication: (id) => {
    const applications = get().applications.filter((a) => a.id !== id);
    saveToStorage('application_records', applications);
    set({ applications });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
