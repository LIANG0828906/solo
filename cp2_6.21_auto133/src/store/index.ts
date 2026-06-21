import { create } from 'zustand';
import { ResumeData, MatchResult, JobRequirement } from '../types';

interface AppState {
  resumeData: ResumeData | null;
  isParsing: boolean;
  parseProgress: number;
  selectedJobId: string | null;
  matchResults: Record<string, MatchResult>;
  jobs: JobRequirement[];
  setResumeData: (data: ResumeData | null) => void;
  setIsParsing: (parsing: boolean) => void;
  setParseProgress: (progress: number) => void;
  setSelectedJobId: (id: string | null) => void;
  setMatchResult: (jobId: string, result: MatchResult) => void;
  setJobs: (jobs: JobRequirement[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  resumeData: null,
  isParsing: false,
  parseProgress: 0,
  selectedJobId: null,
  matchResults: {},
  jobs: [],
  setResumeData: (data) => set({ resumeData: data }),
  setIsParsing: (parsing) => set({ isParsing: parsing }),
  setParseProgress: (progress) => set({ parseProgress: progress }),
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  setMatchResult: (jobId, result) =>
    set((state) => ({
      matchResults: { ...state.matchResults, [jobId]: result },
    })),
  setJobs: (jobs) => set({ jobs }),
}));
