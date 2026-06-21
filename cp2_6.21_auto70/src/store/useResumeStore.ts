import { create } from 'zustand';
import {
  ResumeData,
  ResumeModule,
  PersonalInfo,
  Education,
  WorkExperience,
  Skill,
  Project,
  CustomSection,
  Template,
  TEMPLATES,
  MODULE_TYPES,
} from '@/types/resume';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface ResumeState {
  resumeData: ResumeData;
  zoom: number;
  exportProgress: number;
  isExporting: boolean;
  activeModuleId: string | null;

  setTemplate: (templateId: string) => void;
  getCurrentTemplate: () => Template | undefined;

  addModule: (moduleType: string, index?: number) => void;
  removeModule: (moduleId: string) => void;
  reorderModules: (startIndex: number, endIndex: number) => void;
  toggleModuleVisibility: (moduleId: string) => void;

  setActiveModule: (moduleId: string | null) => void;

  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;

  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  addWorkExperience: () => void;
  updateWorkExperience: (id: string, data: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;

  addSkill: () => void;
  updateSkill: (id: string, data: Partial<Skill>) => void;
  removeSkill: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  removeProject: (id: string) => void;

  addCustomSection: () => void;
  updateCustomSection: (id: string, data: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;

  setZoom: (zoom: number) => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (exporting: boolean) => void;

  setResumeData: (data: ResumeData) => void;
}

const defaultPersonalInfo: PersonalInfo = {
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '138-0000-0000',
  avatar: '',
  summary: '拥有5年前端开发经验，专注于React生态和用户体验优化。',
};

const defaultEducation: Education[] = [
  {
    id: generateId(),
    school: '某某大学',
    degree: '本科',
    major: '计算机科学与技术',
    startDate: '2015-09',
    endDate: '2019-06',
    description: '主修课程：数据结构、算法设计、软件工程等',
  },
];

const defaultWorkExperience: WorkExperience[] = [
  {
    id: generateId(),
    company: '某某科技有限公司',
    position: '高级前端工程师',
    startDate: '2021-03',
    endDate: '至今',
    description: '负责公司核心产品的前端架构设计与开发，带领团队完成多个重要项目。',
  },
];

const defaultSkills: Skill[] = [
  { id: generateId(), name: 'React', level: 90 },
  { id: generateId(), name: 'TypeScript', level: 85 },
  { id: generateId(), name: 'Node.js', level: 75 },
  { id: generateId(), name: 'CSS/HTML', level: 95 },
];

const defaultProjects: Project[] = [
  {
    id: generateId(),
    name: '企业管理平台',
    role: '前端负责人',
    startDate: '2022-01',
    endDate: '2023-06',
    description: '从零搭建企业级管理平台，涵盖权限管理、数据可视化等核心模块。',
    technologies: ['React', 'TypeScript', 'Ant Design', 'ECharts'],
  },
];

const defaultCustomSections: CustomSection[] = [
  {
    id: generateId(),
    title: '获奖情况',
    content: '2022年度优秀员工\n校级一等奖学金',
  },
];

const defaultModules: ResumeModule[] = MODULE_TYPES.map((m) => ({
  id: m.id,
  type: m.type,
  title: m.title,
  visible: true,
}));

const defaultResumeData: ResumeData = {
  templateId: 'blue-business',
  modules: defaultModules,
  personalInfo: defaultPersonalInfo,
  education: defaultEducation,
  workExperience: defaultWorkExperience,
  skills: defaultSkills,
  projects: defaultProjects,
  customSections: defaultCustomSections,
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumeData: defaultResumeData,
  zoom: 1,
  exportProgress: 0,
  isExporting: false,
  activeModuleId: null,

  setTemplate: (templateId: string) =>
    set((state) => ({
      resumeData: { ...state.resumeData, templateId },
    })),

  getCurrentTemplate: () => {
    const { resumeData } = get();
    return TEMPLATES.find((t) => t.id === resumeData.templateId);
  },

  addModule: (moduleType: string, index?: number) =>
    set((state) => {
      const moduleInfo = MODULE_TYPES.find((m) => m.type === moduleType);
      if (!moduleInfo) return state;

      const newModule: ResumeModule = {
        id: `${moduleType}-${generateId()}`,
        type: moduleType as any,
        title: moduleInfo.title,
        visible: true,
      };

      const modules = [...state.resumeData.modules];
      if (index !== undefined) {
        modules.splice(index, 0, newModule);
      } else {
        modules.push(newModule);
      }

      return {
        resumeData: { ...state.resumeData, modules },
      };
    }),

  removeModule: (moduleId: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        modules: state.resumeData.modules.filter((m) => m.id !== moduleId),
      },
    })),

  reorderModules: (startIndex: number, endIndex: number) =>
    set((state) => {
      const result = Array.from(state.resumeData.modules);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return {
        resumeData: { ...state.resumeData, modules: result },
      };
    }),

  toggleModuleVisibility: (moduleId: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        modules: state.resumeData.modules.map((m) =>
          m.id === moduleId ? { ...m, visible: !m.visible } : m
        ),
      },
    })),

  setActiveModule: (moduleId: string | null) =>
    set({ activeModuleId: moduleId }),

  updatePersonalInfo: (info: Partial<PersonalInfo>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        personalInfo: { ...state.resumeData.personalInfo, ...info },
      },
    })),

  addEducation: () =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        education: [
          ...state.resumeData.education,
          {
            id: generateId(),
            school: '',
            degree: '',
            major: '',
            startDate: '',
            endDate: '',
            description: '',
          },
        ],
      },
    })),

  updateEducation: (id: string, data: Partial<Education>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        education: state.resumeData.education.map((edu) =>
          edu.id === id ? { ...edu, ...data } : edu
        ),
      },
    })),

  removeEducation: (id: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        education: state.resumeData.education.filter((e) => e.id !== id),
      },
    })),

  addWorkExperience: () =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        workExperience: [
          ...state.resumeData.workExperience,
          {
            id: generateId(),
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
          },
        ],
      },
    })),

  updateWorkExperience: (id: string, data: Partial<WorkExperience>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        workExperience: state.resumeData.workExperience.map((work) =>
          work.id === id ? { ...work, ...data } : work
        ),
      },
    })),

  removeWorkExperience: (id: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        workExperience: state.resumeData.workExperience.filter(
          (w) => w.id !== id
        ),
      },
    })),

  addSkill: () =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: [
          ...state.resumeData.skills,
          { id: generateId(), name: '', level: 70 },
        ],
      },
    })),

  updateSkill: (id: string, data: Partial<Skill>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: state.resumeData.skills.map((skill) =>
          skill.id === id ? { ...skill, ...data } : skill
        ),
      },
    })),

  removeSkill: (id: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: state.resumeData.skills.filter((s) => s.id !== id),
      },
    })),

  addProject: () =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        projects: [
          ...state.resumeData.projects,
          {
            id: generateId(),
            name: '',
            role: '',
            startDate: '',
            endDate: '',
            description: '',
            technologies: [],
          },
        ],
      },
    })),

  updateProject: (id: string, data: Partial<Project>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        projects: state.resumeData.projects.map((proj) =>
          proj.id === id ? { ...proj, ...data } : proj
        ),
      },
    })),

  removeProject: (id: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        projects: state.resumeData.projects.filter((p) => p.id !== id),
      },
    })),

  addCustomSection: () =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        customSections: [
          ...state.resumeData.customSections,
          { id: generateId(), title: '自定义区块', content: '' },
        ],
      },
    })),

  updateCustomSection: (id: string, data: Partial<CustomSection>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        customSections: state.resumeData.customSections.map((sec) =>
          sec.id === id ? { ...sec, ...data } : sec
        ),
      },
    })),

  removeCustomSection: (id: string) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        customSections: state.resumeData.customSections.filter(
          (s) => s.id !== id
        ),
      },
    })),

  setZoom: (zoom: number) => set({ zoom }),
  setExportProgress: (progress: number) => set({ exportProgress: progress }),
  setIsExporting: (exporting: boolean) => set({ isExporting: exporting }),

  setResumeData: (data: ResumeData) => set({ resumeData: data }),
}));
