export interface TemplateColors {
  background: string;
  text: string;
  title: string;
  accent: string;
  divider: string;
  sectionBg?: string;
}

export interface TemplateFonts {
  heading: string;
  body: string;
}

export interface Template {
  id: string;
  name: string;
  colors: TemplateColors;
  fonts: TemplateFonts;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  summary: string;
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

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export type ModuleType = 'personal' | 'education' | 'work' | 'skills' | 'projects' | 'custom';

export interface ResumeModule {
  id: string;
  type: ModuleType;
  title: string;
  visible: boolean;
}

export interface ResumeData {
  id?: string;
  templateId: string;
  modules: ResumeModule[];
  personalInfo: PersonalInfo;
  education: Education[];
  workExperience: WorkExperience[];
  skills: Skill[];
  projects: Project[];
  customSections: CustomSection[];
}

export interface DraggableModule {
  id: string;
  type: ModuleType;
  title: string;
  icon: string;
}

export const MODULE_TYPES: DraggableModule[] = [
  { id: 'personal', type: 'personal', title: '个人信息', icon: '👤' },
  { id: 'education', type: 'education', title: '教育经历', icon: '🎓' },
  { id: 'work', type: 'work', title: '工作经历', icon: '💼' },
  { id: 'skills', type: 'skills', title: '技能标签', icon: '⚡' },
  { id: 'projects', type: 'projects', title: '项目展示', icon: '📁' },
  { id: 'custom', type: 'custom', title: '自定义区块', icon: '✏️' },
];

export const TEMPLATES: Template[] = [
  {
    id: 'minimal',
    name: '极简灰白',
    colors: {
      background: '#ffffff',
      text: '#333333',
      title: '#2c3e50',
      accent: '#7f8c8d',
      divider: '#e0e0e0',
      sectionBg: '#f8f9fa',
    },
    fonts: {
      heading: "'Segoe UI', sans-serif",
      body: "'Segoe UI', sans-serif",
    },
  },
  {
    id: 'blue-business',
    name: '蓝调商务',
    colors: {
      background: '#ffffff',
      text: '#2c3e50',
      title: '#1a365d',
      accent: '#3182ce',
      divider: '#bee3f8',
      sectionBg: '#ebf8ff',
    },
    fonts: {
      heading: "'Georgia', serif",
      body: "'Segoe UI', sans-serif",
    },
  },
  {
    id: 'warm-orange',
    name: '暖橙创意',
    colors: {
      background: '#fffaf0',
      text: '#4a3728',
      title: '#c05621',
      accent: '#dd6b20',
      divider: '#fed7aa',
      sectionBg: '#fff5eb',
    },
    fonts: {
      heading: "'Trebuchet MS', sans-serif",
      body: "'Segoe UI', sans-serif",
    },
  },
  {
    id: 'dark-tech',
    name: '暗色科技',
    colors: {
      background: '#1a202c',
      text: '#e2e8f0',
      title: '#63b3ed',
      accent: '#4fd1c5',
      divider: '#2d3748',
      sectionBg: '#2d3748',
    },
    fonts: {
      heading: "'Consolas', monospace",
      body: "'Segoe UI', sans-serif",
    },
  },
];

export interface PaperSize {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: string;
}

export const PAPER_SIZES: PaperSize[] = [
  { id: 'a4', name: 'A4', width: 794, height: 1123, unit: 'px' },
  { id: 'a3', name: 'A3', width: 1123, height: 1587, unit: 'px' },
  { id: 'letter', name: 'Letter', width: 816, height: 1056, unit: 'px' },
  { id: 'b5', name: 'B5', width: 720, height: 1018, unit: 'px' },
];
