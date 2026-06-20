export type SkillDimension = '前端' | '后端' | '数据库' | '设计' | '项目管理' | '沟通';

export interface SkillScores {
  前端: number;
  后端: number;
  数据库: number;
  设计: number;
  项目管理: number;
  沟通: number;
}

export interface WordFrequency {
  text: string;
  value: number;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  projects: string[];
}

export interface ParsedResult {
  skillScores: SkillScores;
  wordFrequencies: WordFrequency[];
  experiences: ExperienceItem[];
  rawText: string;
  parsedAt: number;
}

export type JobRole = '前端工程师' | '数据工程师' | '产品经理';

export interface JobBenchmark {
  baseline: SkillScores;
  keywords: string[];
  description: string;
}

export interface MatchComparison {
  dimension: SkillDimension;
  resumeScore: number;
  baselineScore: number;
  diffPercent: number;
  hasWarning: boolean;
}

export interface MatchResult {
  totalScore: number;
  scoreColor: 'red' | 'orange' | 'green';
  comparisons: MatchComparison[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

export type ActiveTab = 'skills' | 'timeline' | 'matching';

export const STORAGE_KEYS = {
  RESUME_TEXT: 'resume_dashboard:text',
  PARSED_RESULT: 'resume_dashboard:parsed',
  ACTIVE_TAB: 'resume_dashboard:tab',
  SELECTED_JOB: 'resume_dashboard:job'
} as const;
