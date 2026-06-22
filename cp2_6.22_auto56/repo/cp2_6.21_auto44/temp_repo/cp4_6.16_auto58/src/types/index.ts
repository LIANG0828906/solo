export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Step {
  id: string;
  projectId: string;
  title: string;
  description: string;
  imageData?: string;
  difficulty: DifficultyLevel;
  order: number;
  createdAt: number;
}

export interface MaterialUsage {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  unitPrice: number;
}

export interface ProjectLog {
  id: string;
  title: string;
  coverImage?: string;
  description: string;
  startDate: number;
  endDate?: number;
  isCompleted: boolean;
  totalHours: number;
  steps: Step[];
  materialUsages: MaterialUsage[];
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  warningThreshold: number;
  createdAt: number;
}

export interface Product {
  id: string;
  title: string;
  coverImage?: string;
  description: string;
  totalHours: number;
  totalCost: number;
  completedDate: number;
}

export type SortOrder = 'asc' | 'desc' | null;

export interface TimelineFilters {
  dateFrom: string;
  dateTo: string;
  keyword: string;
}
