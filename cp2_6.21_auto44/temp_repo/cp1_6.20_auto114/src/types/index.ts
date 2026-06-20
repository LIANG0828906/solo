export interface NodeData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface RelationData {
  id: string;
  source: string;
  target: string;
  type: RelationType;
}

export type RelationType = '依赖' | '衍生' | '对比' | '引用';

export const TAG_COLORS: Record<string, string> = {
  '技术': '#3b82f6',
  '思想': '#a855f7',
  '工具': '#10b981',
  '项目': '#f59e0b',
  '人脉': '#ef4444',
  '学习': '#06b6d4',
  '生活': '#ec4899',
  '其他': '#6b7280'
};

export const TAGS = Object.keys(TAG_COLORS);

export const RELATION_STYLES: Record<string, { color: string; strokeDasharray: string }> = {
  '依赖': { color: '#3b82f6', strokeDasharray: 'none' },
  '衍生': { color: '#10b981', strokeDasharray: '8,4' },
  '对比': { color: '#f59e0b', strokeDasharray: '2,3' },
  '引用': { color: '#6b7280', strokeDasharray: 'none' }
};

export const RELATION_TYPES = ['依赖', '衍生', '对比', '引用'] as const;
