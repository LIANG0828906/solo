import { create } from 'zustand'
import {
  ResumeData,
  ModuleType,
  createEmptyResume,
  DEFAULT_MODULE_ORDER,
  WorkExperience,
  Education,
  Skill,
  Project,
} from '@/data/resumeModel'

interface ResumeState {
  resumeData: ResumeData
  theme: string
  moduleOrder: ModuleType[]
  setResumeData: (data: ResumeData) => void
  setTheme: (theme: string) => void
  setModuleOrder: (order: ModuleType[]) => void
  updatePersonal: (field: keyof ResumeData['personal'], value: string) => void
  addWork: (work: WorkExperience) => void
  updateWork: (id: string, field: keyof WorkExperience, value: string | string[]) => void
  removeWork: (id: string) => void
  addEducation: (edu: Education) => void
  updateEducation: (id: string, field: keyof Education, value: string) => void
  removeEducation: (id: string) => void
  addSkill: (skill: Skill) => void
  updateSkill: (id: string, field: keyof Skill, value: string | number) => void
  removeSkill: (id: string) => void
  addProject: (project: Project) => void
  updateProject: (id: string, field: keyof Project, value: string | string[]) => void
  removeProject: (id: string) => void
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumeData: createEmptyResume(),
  theme: '简洁灰',
  moduleOrder: DEFAULT_MODULE_ORDER,

  setResumeData: (data) => set({ resumeData: data }),
  setTheme: (theme) => set({ theme }),
  setModuleOrder: (order) => set({ moduleOrder: order }),

  updatePersonal: (field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        personal: {
          ...state.resumeData.personal,
          [field]: value,
        },
      },
    })),

  addWork: (work) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        work: [...state.resumeData.work, work],
      },
    })),

  updateWork: (id, field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        work: state.resumeData.work.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    })),

  removeWork: (id) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        work: state.resumeData.work.filter((item) => item.id !== id),
      },
    })),

  addEducation: (edu) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        education: [...state.resumeData.education, edu],
      },
    })),

  updateEducation: (id, field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        education: state.resumeData.education.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    })),

  removeEducation: (id) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        education: state.resumeData.education.filter((item) => item.id !== id),
      },
    })),

  addSkill: (skill) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: [...state.resumeData.skills, skill],
      },
    })),

  updateSkill: (id, field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: state.resumeData.skills.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    })),

  removeSkill: (id) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        skills: state.resumeData.skills.filter((item) => item.id !== id),
      },
    })),

  addProject: (project) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        projects: [...state.resumeData.projects, project],
      },
    })),

  updateProject: (id, field, value) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        projects: state.resumeData.projects.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    })),

  removeProject: (id) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        projects: state.resumeData.projects.filter((item) => item.id !== id),
      },
    })),
}))

export default useResumeStore
