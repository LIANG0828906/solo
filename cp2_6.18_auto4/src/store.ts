import { create } from 'zustand';
import { ApplicationData, AssessmentResult } from './EventBridge';

type PageType = 'application' | 'assessment' | 'result';

interface AppStore {
  currentPage: PageType;
  applicationData: ApplicationData | null;
  assessmentResult: AssessmentResult | null;
  setCurrentPage: (page: PageType) => void;
  setApplicationData: (data: ApplicationData) => void;
  setAssessmentResult: (result: AssessmentResult) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: 'application',
  applicationData: null,
  assessmentResult: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  setApplicationData: (data) => set({ applicationData: data }),
  setAssessmentResult: (result) => set({ assessmentResult: result }),
  reset: () =>
    set({
      currentPage: 'application',
      applicationData: null,
      assessmentResult: null,
    }),
}));
