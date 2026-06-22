import { create } from 'zustand';
import type { CaseEntry, LawArticle, AppState } from './types';

interface AppActions {
  setCases: (cases: CaseEntry[]) => void;
  setCurrentCase: (caseData: CaseEntry | null) => void;
  setLaws: (laws: LawArticle[]) => void;
  addCitedLaw: (law: LawArticle) => void;
  removeCitedLaw: (lawId: string) => void;
  clearCitedLaws: () => void;
  setJudgementDraft: (text: string) => void;
  addScore: (points: number) => void;
  unlockBadge: (badge: string) => void;
  updateCaseStatus: (caseId: string, status: CaseEntry['status'], isDifficult?: boolean) => void;
  setShowAppealModal: (show: boolean, caseId?: string) => void;
  setShowSealAnimation: (show: boolean) => void;
  setShowRollingAnimation: (show: boolean) => void;
  toggleWitness: (caseId: string, witnessId: string) => void;
  toggleEvidence: (caseId: string, evidenceId: string) => void;
}

export const useStore = create<AppState & AppActions>((set, get) => ({
  cases: [],
  currentCase: null,
  laws: [],
  citedLaws: [],
  judgementDraft: '',
  userScore: 0,
  unlockedBadges: [],
  showAppealModal: false,
  appealCaseId: null,
  showSealAnimation: false,
  showRollingAnimation: false,

  setCases: (cases) => set({ cases }),
  setCurrentCase: (caseData) => set({ 
    currentCase: caseData,
    judgementDraft: '',
    citedLaws: [],
  }),
  setLaws: (laws) => set({ laws }),
  addCitedLaw: (law) => {
    const { citedLaws } = get();
    if (!citedLaws.find(l => l.id === law.id)) {
      set({ citedLaws: [...citedLaws, law] });
    }
  },
  removeCitedLaw: (lawId) => {
    const { citedLaws } = get();
    set({ citedLaws: citedLaws.filter(l => l.id !== lawId) });
  },
  clearCitedLaws: () => set({ citedLaws: [] }),
  setJudgementDraft: (text) => set({ judgementDraft: text }),
  addScore: (points) => {
    const { userScore, unlockedBadges } = get();
    const newScore = userScore + points;
    const newBadges = [...unlockedBadges];
    if (newScore >= 100 && !unlockedBadges.includes('刑名师爷')) {
      newBadges.push('刑名师爷');
    }
    set({ userScore: newScore, unlockedBadges: newBadges });
  },
  unlockBadge: (badge) => {
    const { unlockedBadges } = get();
    if (!unlockedBadges.includes(badge)) {
      set({ unlockedBadges: [...unlockedBadges, badge] });
    }
  },
  updateCaseStatus: (caseId, status, isDifficult) => {
    const { cases } = get();
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return { ...c, status, isDifficult: isDifficult ?? c.isDifficult };
      }
      return c;
    });
    if (isDifficult) {
      const difficultCase = updatedCases.find(c => c.id === caseId);
      if (difficultCase) {
        const otherCases = updatedCases.filter(c => c.id !== caseId);
        set({ cases: [difficultCase, ...otherCases] });
        return;
      }
    }
    set({ cases: updatedCases });
  },
  setShowAppealModal: (show, caseId) => set({ 
    showAppealModal: show, 
    appealCaseId: caseId ?? null 
  }),
  setShowSealAnimation: (show) => set({ showSealAnimation: show }),
  setShowRollingAnimation: (show) => set({ showRollingAnimation: show }),
  toggleWitness: (caseId, witnessId) => {
    const { cases, currentCase } = get();
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          witnesses: c.witnesses.map(w => 
            w.id === witnessId ? { ...w, selected: !w.selected } : w
          ),
        };
      }
      return c;
    });
    const updatedCurrent = currentCase && currentCase.id === caseId
      ? updatedCases.find(c => c.id === caseId) || currentCase
      : currentCase;
    set({ cases: updatedCases, currentCase: updatedCurrent });
  },
  toggleEvidence: (caseId, evidenceId) => {
    const { cases, currentCase } = get();
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          evidences: c.evidences.map(e => 
            e.id === evidenceId ? { ...e, selected: !e.selected } : e
          ),
        };
      }
      return c;
    });
    const updatedCurrent = currentCase && currentCase.id === caseId
      ? updatedCases.find(c => c.id === caseId) || currentCase
      : currentCase;
    set({ cases: updatedCases, currentCase: updatedCurrent });
  },
}));
