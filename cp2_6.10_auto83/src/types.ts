export type CaseType = 'homicide' | 'land' | 'marriage';
export type CaseStatus = 'pending' | 'review' | 'closed';
export type Urgency = 'high' | 'medium' | 'low';
export type Department = '吏' | '户' | '礼' | '兵' | '刑' | '工';

export interface Witness {
  id: string;
  name: string;
  avatar: string;
  testimony: string;
  selected: boolean;
}

export interface Evidence {
  id: string;
  name: string;
  icon: string;
  description: string;
  selected: boolean;
}

export interface CaseEntry {
  id: string;
  caseNumber: string;
  caseType: CaseType;
  plaintiff: string;
  receiveTime: string;
  urgency: Urgency;
  status: CaseStatus;
  paperContent: string;
  witnesses: Witness[];
  evidences: Evidence[];
  defendantInjured: boolean;
  testimonyConflict: boolean;
  isDifficult?: boolean;
}

export interface LawArticle {
  id: string;
  title: string;
  content: string;
  department: Department;
  strokeCount: number;
  penalty: string[];
  keywords: string[];
}

export interface Judgement {
  id?: string;
  caseId: string;
  judgementText: string;
  citedLaws: string[];
  sentence: string;
  score?: number;
  comment?: string;
  appealed?: boolean;
  riskPercent?: number;
}

export interface UserSession {
  id: string;
  totalScore: number;
  unlockedBadges: string[];
}

export interface ValidateRequest {
  judgementText: string;
  caseId: string;
  citedLaws: string[];
}

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SubmitRequest {
  caseId: string;
  judgementText: string;
  citedLaws: string[];
  selectedWitnesses: string[];
  selectedEvidences: string[];
  sentence: string;
}

export interface SubmitResponse {
  success: boolean;
  score: number;
  comment: string;
  triggerAppeal: boolean;
  riskPercent: number;
}

export interface AppState {
  cases: CaseEntry[];
  currentCase: CaseEntry | null;
  laws: LawArticle[];
  citedLaws: LawArticle[];
  judgementDraft: string;
  userScore: number;
  unlockedBadges: string[];
  showAppealModal: boolean;
  appealCaseId: string | null;
  showSealAnimation: boolean;
  showRollingAnimation: boolean;
}
