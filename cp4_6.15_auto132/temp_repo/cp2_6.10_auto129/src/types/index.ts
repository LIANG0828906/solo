export interface Poet {
  id: string;
  name: string;
  styleName: string;
  temperament: '豪放' | '婉约' | '闲适';
}

export interface ValidationResult {
  isValid: boolean;
  errors?: {
    position: number;
    type: string;
    suggestion: string;
  }[];
}

export interface Verse {
  id: string;
  content: string;
  poetId: string;
  poetName: string;
  lineNumber: number;
  validation?: ValidationResult;
}

export interface PoetrySession {
  id: string;
  title: string;
  theme: string;
  date: string;
  poets: Poet[];
  verses: Verse[];
  createdAt: string;
}

export interface StatisticsData {
  totalSessions: number;
  totalVerses: number;
  totalPoets: number;
  styleDistribution: {
    style: string;
    count: number;
  }[];
  temperamentDistribution: {
    temperament: string;
    count: number;
  }[];
}
