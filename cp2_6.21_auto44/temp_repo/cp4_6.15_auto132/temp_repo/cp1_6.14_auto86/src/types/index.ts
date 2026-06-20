export type SkillCategory = 'frontend' | 'backend' | 'design' | 'product' | 'other';

export interface SkillTag {
  name: string;
  category: SkillCategory;
}

export interface TimelineEvent {
  id: string;
  startYear: number;
  endYear: number;
  position: string;
  company: string;
  description: string;
  skills: SkillTag[];
}

export type LayoutMode = 'horizontal' | 'vertical';

export interface TimelineFilters {
  categories: SkillCategory[];
  yearRange: [number, number];
}

export const SKILL_CATEGORY_META: Record<SkillCategory, { label: string; color: string; bgColor: string }> = {
  frontend: { label: '前端', color: '#2196f3', bgColor: 'rgba(33, 150, 243, 0.12)' },
  backend: { label: '后端', color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.12)' },
  design: { label: '设计', color: '#9c27b0', bgColor: 'rgba(156, 39, 176, 0.12)' },
  product: { label: '产品', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.12)' },
  other: { label: '其他', color: '#757575', bgColor: 'rgba(117, 117, 117, 0.12)' },
};

export const ALL_CATEGORIES: SkillCategory[] = ['frontend', 'backend', 'design', 'product', 'other'];
