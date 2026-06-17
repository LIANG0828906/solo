export type DesignStage = 'draft' | 'review' | 'final';

export interface Proposal {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  stage: DesignStage;
  designImages: string[];
  averageRating: number;
  ratingCount: number;
  createdAt: string;
}

export interface Feedback {
  id: string;
  proposalId: string;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface ProposalStore {
  proposals: Proposal[];
  selectedProposal: Proposal | null;
  feedbacks: Feedback[];
  searchKeyword: string;
  filterStage: DesignStage | 'all';
  setProposals: (proposals: Proposal[]) => void;
  setSelectedProposal: (proposal: Proposal | null) => void;
  setFeedbacks: (feedbacks: Feedback[]) => void;
  addFeedback: (feedback: Feedback) => void;
  updateFeedbackLikes: (feedbackId: string) => void;
  updateProposalRating: (proposalId: string, rating: number) => void;
  setSearchKeyword: (keyword: string) => void;
  setFilterStage: (stage: DesignStage | 'all') => void;
  getFilteredProposals: () => Proposal[];
}
