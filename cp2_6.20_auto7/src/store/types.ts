export type ComponentType = 'heading' | 'experience' | 'skill-bar' | 'education' | 'project-list';

export interface ComponentStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  fontWeight: string;
}

export interface ResumeComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: ComponentStyle;
}

export interface ResumeLayout {
  width: number;
  height: number;
}

export const COMPONENT_DEFAULTS: Record<ComponentType, { width: number; height: number; content: string; style: ComponentStyle }> = {
  heading: {
    width: 400,
    height: 60,
    content: '你的姓名',
    style: { fontFamily: 'Noto Sans SC', fontSize: 28, color: '#1e293b', backgroundColor: 'transparent', fontWeight: '700' },
  },
  experience: {
    width: 380,
    height: 120,
    content: '公司名称 | 职位\n2023.06 - 至今\n负责核心业务模块开发，提升系统性能30%',
    style: { fontFamily: 'Noto Sans SC', fontSize: 14, color: '#334155', backgroundColor: 'transparent', fontWeight: '400' },
  },
  'skill-bar': {
    width: 300,
    height: 50,
    content: 'JavaScript 85%',
    style: { fontFamily: 'Noto Sans SC', fontSize: 14, color: '#334155', backgroundColor: 'transparent', fontWeight: '500' },
  },
  education: {
    width: 360,
    height: 80,
    content: '某某大学 | 计算机科学\n2019.09 - 2023.06\nGPA: 3.8/4.0',
    style: { fontFamily: 'Noto Sans SC', fontSize: 14, color: '#334155', backgroundColor: 'transparent', fontWeight: '400' },
  },
  'project-list': {
    width: 380,
    height: 140,
    content: '项目名称一\n使用 React + TypeScript 构建的前端应用\n\n项目名称二\n基于 FastAPI 的后端服务架构',
    style: { fontFamily: 'Noto Sans SC', fontSize: 14, color: '#334155', backgroundColor: 'transparent', fontWeight: '400' },
  },
};

export const CANVAS_WIDTH = 595;
export const CANVAS_HEIGHT = 842;

export const FONT_OPTIONS = [
  'Noto Sans SC',
  'DM Serif Display',
  'Georgia',
  'Courier New',
];

export const FONT_WEIGHT_OPTIONS = [
  { label: '细体', value: '300' },
  { label: '常规', value: '400' },
  { label: '中等', value: '500' },
  { label: '粗体', value: '700' },
];
