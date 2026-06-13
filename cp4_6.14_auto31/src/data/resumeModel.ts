export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  avatar?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  highlights: string[];
}

export interface ResumeData {
  personal: PersonalInfo;
  work: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
}

export interface ResumeEntity {
  id: string;
  title: string;
  data: ResumeData;
  theme: string;
  moduleOrder: ModuleType[];
  createdAt: string;
  updatedAt: string;
}

export type ModuleType = 'personal' | 'work' | 'education' | 'skills' | 'projects';

export interface ThemeConfig {
  primary: string;
  background: string;
  text: string;
  accent: string;
  shadow: string;
  fontFamily: string;
}

export const THEME_CONFIG: Record<string, ThemeConfig> = {
  '简洁灰': {
    primary: '#4B5563',
    background: '#F9FAFB',
    text: '#1F2937',
    accent: '#6B7280',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  '商务蓝': {
    primary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1E3A8A',
    accent: '#3B82F6',
    shadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
  },
  '极简白': {
    primary: '#111827',
    background: '#FFFFFF',
    text: '#111827',
    accent: '#374151',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    fontFamily: '"Helvetica Neue", Arial, sans-serif'
  },
  '暖橙': {
    primary: '#EA580C',
    background: '#FFFBEB',
    text: '#7C2D12',
    accent: '#F97316',
    shadow: '0 4px 12px rgba(234, 88, 12, 0.15)',
    fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif'
  },
  '深色专业': {
    primary: '#60A5FA',
    background: '#0F172A',
    text: '#E2E8F0',
    accent: '#93C5FD',
    shadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
  }
};

export const DEFAULT_MODULE_ORDER: ModuleType[] = ['personal', 'work', 'education', 'skills', 'projects'];

export const MAX_WORK_EXPERIENCE = 5;
export const MAX_EDUCATION = 3;
export const MAX_SKILLS = 15;
export const MAX_PROJECTS = 4;

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function createEmptyResume(): ResumeData {
  return {
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      summary: ''
    },
    work: [],
    education: [],
    skills: [],
    projects: []
  };
}
