export type ProjectType = '角色设计' | '场景绘制' | '漫画分镜' | '绘本插图' | '品牌视觉';

export type ProjectStatus = '进行中' | '待确认' | '已完成';

export type StageStatus = 'pending' | 'active' | 'completed';

export type FilterStatus = '全部' | '进行中' | '待确认' | '已完成';

export type SortType = '按截止日期' | '按创建时间' | '按预算';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface Stage {
  id: string;
  index: number;
  name: string;
  status: StageStatus;
  notes: string;
  confirmed: boolean;
  attachments: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  clientEmail: string;
  budget: number;
  deadline: string;
  projectType: ProjectType;
  status: ProjectStatus;
  createdAt: string;
  stages: Stage[];
}

export interface CreateProjectInput {
  name: string;
  clientEmail: string;
  budget: number;
  deadline: string;
  projectType: ProjectType;
}

export const STAGE_NAMES = ['初步沟通', '草图', '线稿', '上色', '终稿交付'] as const;

export const PROJECT_TYPES: ProjectType[] = ['角色设计', '场景绘制', '漫画分镜', '绘本插图', '品牌视觉'];

export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  '角色设计': '#7C3AED',
  '场景绘制': '#2563EB',
  '漫画分镜': '#D97706',
  '绘本插图': '#059669',
  '品牌视觉': '#DC2626',
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  '进行中': '#3B82F6',
  '待确认': '#F59E0B',
  '已完成': '#10B981',
};
