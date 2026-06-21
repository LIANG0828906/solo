export interface Experience {
  company: string;
  position: string;
  duration: string;
  description?: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  duration: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  softSkills: string[];
  industryKnowledge: string[];
  summary?: string;
}

export interface RadarDimension {
  dimension: string;
  score: number;
  fullMark: number;
}

export interface MatchResult {
  jobId: string;
  overallScore: number;
  radarData: RadarDimension[];
  strengths: string[];
  weaknesses: string[];
  matchedSkills: string[];
  unmatchedSkills: string[];
  missingSkills: string[];
}

export interface JobRequirement {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYears: number;
  educationLevel: string;
  industry: string;
}
