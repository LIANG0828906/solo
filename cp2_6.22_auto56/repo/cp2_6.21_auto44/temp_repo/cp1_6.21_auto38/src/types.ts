export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type ItemStatus = 'todo' | 'in-progress' | 'completed';

export interface CodeReference {
  filePath: string;
  lineNumber?: number;
}

export interface TechDebtItem {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  estimatedHours: number;
  status: ItemStatus;
  codeReferences: CodeReference[];
  createdAt: number;
  updatedAt: number;
}

export interface FileStats {
  filePath: string;
  totalItems: number;
  totalHours: number;
  maxSeverity: SeverityLevel;
}

export interface HealthScore {
  score: number;
  comment: string;
  breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
