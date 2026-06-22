export interface PersonalData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string;
}

export type ModuleType = 'personal' | 'work' | 'education' | 'skills' | 'projects';

export interface ResumeModule {
  id: string;
  type: ModuleType;
  collapsed: boolean;
  data: PersonalData | WorkExperience[] | Education[] | Skill[] | Project[];
}

export type TemplateType = 'simple' | 'twocolumn' | 'creative';

export interface ResumeData {
  id: string;
  template: TemplateType;
  avatarUrl: string;
  modules: ResumeModule[];
  updatedAt: string;
}

export interface ResumeVersion {
  id: string;
  template: TemplateType;
  updatedAt: string;
  preview: string;
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  personal: '个人信息',
  work: '工作经历',
  education: '教育背景',
  skills: '技能标签',
  projects: '项目展示'
};

export function createDefaultModules(): ResumeModule[] {
  return [
    {
      id: 'mod-personal',
      type: 'personal',
      collapsed: false,
      data: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        summary: ''
      } as PersonalData
    },
    {
      id: 'mod-work',
      type: 'work',
      collapsed: false,
      data: [] as WorkExperience[]
    },
    {
      id: 'mod-education',
      type: 'education',
      collapsed: false,
      data: [] as Education[]
    },
    {
      id: 'mod-skills',
      type: 'skills',
      collapsed: false,
      data: [] as Skill[]
    },
    {
      id: 'mod-projects',
      type: 'projects',
      collapsed: false,
      data: [] as Project[]
    }
  ];
}

export function createDefaultResume(): ResumeData {
  return {
    id: generateId(),
    template: 'simple',
    avatarUrl: '',
    modules: createDefaultModules(),
    updatedAt: new Date().toISOString()
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
