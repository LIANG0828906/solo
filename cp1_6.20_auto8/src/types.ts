export interface Education {
  id: string;
  school: string;
  major: string;
  startDate: string;
  endDate: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectExperience {
  id: string;
  name: string;
  role: string;
  description: string;
}

export type TemplateType = 'light' | 'dark';

export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  summary: string;
  template: TemplateType;
  blockOrder: string[];
  education: Education[];
  workExperience: WorkExperience[];
  projectExperience: ProjectExperience[];
}

export type ApplicationStatus = 'applied' | 'viewed' | 'interviewed' | 'rejected';

export interface ApplicationRecord {
  id: string;
  companyName: string;
  positionName: string;
  status: ApplicationStatus;
  date: string;
  notes: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: '投递中',
  viewed: '已查看',
  interviewed: '已面试',
  rejected: '已拒绝',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: '#3B82F6',
  viewed: '#10B981',
  interviewed: '#F59E0B',
  rejected: '#EF4444',
};

export const DEFAULT_BLOCK_ORDER = ['personal', 'education', 'workExperience', 'projectExperience'];

export function createDefaultResume(): ResumeData {
  return {
    name: '',
    phone: '',
    email: '',
    summary: '',
    template: 'light',
    blockOrder: [...DEFAULT_BLOCK_ORDER],
    education: [],
    workExperience: [],
    projectExperience: [],
  };
}
