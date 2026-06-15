export type SkillDomain = 'frontend' | 'backend' | 'database' | 'devops';

export interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'book';
  url: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillNode {
  id: string;
  name: string;
  domain: SkillDomain;
  proficiency: number;
  dependencies: string[];
  subSkills: string[];
  proficiencyThreshold: number;
  description: string;
  color: string;
  resources: LearningResource[];
}

export interface JobRequirement {
  id: string;
  title: string;
  description: string;
  requiredSkills: {
    skillId: string;
    minProficiency: number;
  }[];
  preferredSkills?: string[];
  salaryRange: string;
}

export interface PathStage {
  stage: number;
  title: string;
  skillIds: string[];
  estimatedHours: number;
  description: string;
}

export interface PlanRequest {
  currentProficiencies: {
    skillId: string;
    proficiency: number;
  }[];
  targetJobId: string;
  maxHoursPerWeek?: number;
}

export interface PlanResponse {
  jobTitle: string;
  missingSkills: {
    skill: SkillNode;
    currentProficiency: number;
    requiredProficiency: number;
    gap: number;
  }[];
  learningPath: PathStage[];
  totalEstimatedHours: number;
  estimatedWeeks: number;
  recommendations: string[];
}
