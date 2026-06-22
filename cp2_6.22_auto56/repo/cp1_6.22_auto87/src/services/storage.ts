import type { User, Project, StudyRecord } from '../types';

const KEYS = {
  user: 'study_plan_user',
  projects: 'study_plan_projects',
  records: 'study_plan_records',
};

export const storage = {
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(KEYS.user);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  },

  getProjects: (): Project[] => {
    try {
      const data = localStorage.getItem(KEYS.projects);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setProjects: (projects: Project[]) => {
    localStorage.setItem(KEYS.projects, JSON.stringify(projects));
  },

  getRecords: (): StudyRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.records);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setRecords: (records: StudyRecord[]) => {
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  },

  clearAll: () => {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
