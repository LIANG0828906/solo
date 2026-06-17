import { create } from 'zustand';
import type { ApplicationData, AssessmentResult } from '../types';

type PageType = 'application' | 'processing' | 'result';

interface AppState {
  currentPage: PageType;
  applicationData: ApplicationData | null;
  assessmentResult: AssessmentResult | null;
  setCurrentPage: (page: PageType) => void;
  setApplicationData: (data: ApplicationData) => void;
  setAssessmentResult: (result: AssessmentResult) => void;
  reset: () => void;
}

const useAppStore = create<AppState>((set) => ({
  currentPage: 'application',
  applicationData: null,
  assessmentResult: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  setApplicationData: (data) => set({ applicationData: data }),
  setAssessmentResult: (result) => set({ assessmentResult: result }),
  reset: () => set({
    currentPage: 'application',
    applicationData: null,
    assessmentResult: null
  })
}));

export default useAppStore;
