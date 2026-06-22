import { create } from 'zustand';
import type { Proposal, Feedback, DesignStage, ProposalStore } from '../types';

export const useProposalStore = create<ProposalStore>((set, get) => ({
  proposals: [] as Proposal[],
  selectedProposal: null as Proposal | null,
  feedbacks: [] as Feedback[],
  searchKeyword: '',
  filterStage: 'all' as DesignStage | 'all',

  setProposals: (proposals: Proposal[]) => set({ proposals }),
  setSelectedProposal: (proposal: Proposal | null) => set({ selectedProposal: proposal }),
  setFeedbacks: (feedbacks: Feedback[]) => set({ feedbacks }),
  addFeedback: (feedback: Feedback) => set((state) => ({ feedbacks: [feedback, ...state.feedbacks] })),
  updateFeedbackLikes: (feedbackId: string) => set((state) => ({
    feedbacks: state.feedbacks.map(f =>
      f.id === feedbackId ? { ...f, likes: f.likes + 1 } : f
    )
  })),
  updateProposalRating: (proposalId: string, rating: number) => set((state) => {
    const proposals = state.proposals.map(p => {
      if (p.id === proposalId) {
        const newCount = p.ratingCount + 1;
        const newAvg = ((p.averageRating * p.ratingCount) + rating) / newCount;
        return { ...p, averageRating: Math.round(newAvg * 10) / 10, ratingCount: newCount };
      }
      return p;
    });
    const selectedProposal = state.selectedProposal?.id === proposalId
      ? proposals.find(p => p.id === proposalId) || null
      : state.selectedProposal;
    return { proposals, selectedProposal };
  }),
  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
  setFilterStage: (stage: DesignStage | 'all') => set({ filterStage: stage }),
  getFilteredProposals: () => {
    const state = get();
    return state.proposals.filter(p => {
      const matchKeyword = state.searchKeyword === '' ||
        p.name.toLowerCase().includes(state.searchKeyword.toLowerCase()) ||
        p.description.toLowerCase().includes(state.searchKeyword.toLowerCase());
      const matchStage = state.filterStage === 'all' || p.stage === state.filterStage;
      return matchKeyword && matchStage;
    });
  }
}));
