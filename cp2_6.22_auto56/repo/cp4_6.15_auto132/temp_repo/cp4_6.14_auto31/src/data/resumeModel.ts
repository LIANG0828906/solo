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

export function validateWorkCount(workList: WorkExperience[]): { valid: boolean; error?: string } {
  if (workList.length > MAX_WORK_EXPERIENCE) {
    return { valid: false, error: `工作经历最多${MAX_WORK_EXPERIENCE}条，当前${workList.length}条，超出${workList.length - MAX_WORK_EXPERIENCE}条，请删除多余条目` };
  }
  return { valid: true };
}

export function validateEducationCount(eduList: Education[]): { valid: boolean; error?: string } {
  if (eduList.length > MAX_EDUCATION) {
    return { valid: false, error: `教育背景最多${MAX_EDUCATION}条，当前${eduList.length}条，超出${eduList.length - MAX_EDUCATION}条，请删除多余条目` };
  }
  return { valid: true };
}

export function validateSkillsCount(skills: Skill[]): { valid: boolean; error?: string } {
  if (skills.length > MAX_SKILLS) {
    return { valid: false, error: `技能标签最多${MAX_SKILLS}个，当前${skills.length}个，超出${skills.length - MAX_SKILLS}个，请删除多余标签` };
  }
  return { valid: true };
}

export function validateProjectsCount(projects: Project[]): { valid: boolean; error?: string } {
  if (projects.length > MAX_PROJECTS) {
    return { valid: false, error: `项目经历最多${MAX_PROJECTS}条，当前${projects.length}条，超出${projects.length - MAX_PROJECTS}条，请删除多余条目` };
  }
  return { valid: true };
}

export function validateResumeData(data: ResumeData): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!validateRequired(data.personal.name)) {
    errors['personal.name'] = '姓名不能为空';
  }

  if (!validateRequired(data.personal.email)) {
    errors['personal.email'] = '邮箱不能为空';
  } else if (!validateEmail(data.personal.email)) {
    errors['personal.email'] = '邮箱格式不正确';
  }

  if (!validateRequired(data.personal.phone)) {
    errors['personal.phone'] = '手机号不能为空';
  } else if (!validatePhone(data.personal.phone)) {
    errors['personal.phone'] = '手机号格式不正确';
  }

  const workCountResult = validateWorkCount(data.work);
  if (!workCountResult.valid) {
    errors['work'] = workCountResult.error!;
  }

  data.work.forEach((work, index) => {
    if (!validateRequired(work.company)) {
      errors[`work[${index}].company`] = '公司名称不能为空';
    }
    if (!validateRequired(work.position)) {
      errors[`work[${index}].position`] = '职位不能为空';
    }
    if (work.startDate && work.endDate && !validateDateRange(work.startDate, work.endDate)) {
      errors[`work[${index}].date`] = '开始日期不能晚于结束日期';
    }
  });

  const eduCountResult = validateEducationCount(data.education);
  if (!eduCountResult.valid) {
    errors['education'] = eduCountResult.error!;
  }

  data.education.forEach((edu, index) => {
    if (!validateRequired(edu.school)) {
      errors[`education[${index}].school`] = '学校名称不能为空';
    }
    if (!validateRequired(edu.degree)) {
      errors[`education[${index}].degree`] = '学历不能为空';
    }
    if (edu.startDate && edu.endDate && !validateDateRange(edu.startDate, edu.endDate)) {
      errors[`education[${index}].date`] = '开始日期不能晚于结束日期';
    }
  });

  const skillsCountResult = validateSkillsCount(data.skills);
  if (!skillsCountResult.valid) {
    errors['skills'] = skillsCountResult.error!;
  }

  data.skills.forEach((skill, index) => {
    if (!validateRequired(skill.name)) {
      errors[`skills[${index}].name`] = '技能名称不能为空';
    }
  });

  const projectsCountResult = validateProjectsCount(data.projects);
  if (!projectsCountResult.valid) {
    errors['projects'] = projectsCountResult.error!;
  }

  data.projects.forEach((project, index) => {
    if (!validateRequired(project.name)) {
      errors[`projects[${index}].name`] = '项目名称不能为空';
    }
    if (!validateRequired(project.role)) {
      errors[`projects[${index}].role`] = '担任角色不能为空';
    }
    if (project.startDate && project.endDate && !validateDateRange(project.startDate, project.endDate)) {
      errors[`projects[${index}].date`] = '开始日期不能晚于结束日期';
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
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
