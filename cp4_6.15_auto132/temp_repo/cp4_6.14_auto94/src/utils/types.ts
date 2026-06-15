export type DefectCategory = '裂痕' | '划痕' | '色差' | '污渍' | '其他';
export type DefectSeverity = '轻微' | '一般' | '严重';
export type AnnotationTool = 'rectangle' | 'circle' | 'brush';

export interface Annotation {
  id: string;
  tool: AnnotationTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  category: DefectCategory;
  severity: DefectSeverity;
  labelNumber: number;
  createdAt: string;
}

export interface DefectRecord {
  id: string;
  imageName: string;
  imageUrl: string;
  annotations: Annotation[];
  createdAt: string;
}

export interface TrendDataPoint {
  date: string;
  totalInspected: number;
  defectCount: number;
  defectRate: number;
}

export interface CategoryCount {
  category: DefectCategory;
  count: number;
  percentage: number;
}

export interface DailyReport {
  id: string;
  date: string;
  totalInspected: number;
  defectCount: number;
  defectRate: number;
  categoryBreakdown: CategoryCount[];
  createdAt: string;
}

export const DEFECT_CATEGORIES: DefectCategory[] = ['裂痕', '划痕', '色差', '污渍', '其他'];
export const DEFECT_SEVERITIES: DefectSeverity[] = ['轻微', '一般', '严重'];

export const CATEGORY_COLORS: Record<DefectCategory, string> = {
  '裂痕': '#ef4444',
  '划痕': '#f97316',
  '色差': '#eab308',
  '污渍': '#22c55e',
  '其他': '#a855f7',
};
