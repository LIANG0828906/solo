export type SkillDomain = 'frontend' | 'backend' | 'database' | 'devops';

export interface SkillNode {
  id: string;
  name: string;
  domain: SkillDomain;
  proficiency: number;
  dependencies: string[];
  subSkills?: string[];
  proficiencyThreshold: number;
  description: string;
}

export interface LearningResource {
  id: string;
  skillId: string;
  name: string;
  type: 'document' | 'video' | 'course';
  url: string;
  duration: number;
  difficulty: number;
  rating: number;
  reviews: string[];
  isFavorite?: boolean;
}

export interface JobRequirement {
  id: string;
  title: string;
  requiredSkills: { skillId: string; minProficiency: number }[];
}

export type StageStatus = 'not-started' | 'in-progress' | 'completed';

export interface PathStage {
  id: string;
  skillId: string;
  skillName: string;
  estimatedDuration: number;
  resources: LearningResource[];
  status: StageStatus;
  order: number;
}

export interface PlanRequest {
  targetJobId: string;
  currentSkills: { skillId: string; proficiency: number }[];
}

export interface PlanResponse {
  jobTitle: string;
  totalEstimatedHours: number;
  stages: PathStage[];
  missingSkills: string[];
}

export interface DomainColors {
  frontend: string;
  backend: string;
  database: string;
  devops: string;
}

export interface UIState {
  isModalOpen: boolean;
  selectedResource: LearningResource | null;
  isGraphLoading: boolean;
  isPathGenerating: boolean;
}

export interface SkillGraphNode extends SkillNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  isHighlighted?: boolean;
  isSearchResult?: boolean;
}

export interface SkillGraphLink {
  source: string;
  target: string;
}

export interface ThemeColors {
  background: string;
  card: string;
  accentPrimary: string;
  accentSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ResourceType = 'document' | 'video' | 'course';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  status: StageStatus;
  duration: number;
  resources: LearningResource[];
}

export interface SearchResult {
  skillId: string;
  skillName: string;
  domain: SkillDomain;
  matchScore: number;
}
