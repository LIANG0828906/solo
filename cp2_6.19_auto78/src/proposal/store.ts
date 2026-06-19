import { create } from 'zustand';
import type { Proposal, Comment, ProposalCategory, ProposalStatus, VoteType, PaginationResult } from './types';
import { proposalService } from './services';

interface ProposalState {
  proposals: Proposal[];
  currentProposal: Proposal | null;
  comments: Comment[];
  userVotes: Record<string, VoteType>;
  loading: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
  category: ProposalCategory | undefined;
  status: ProposalStatus | undefined;
  keyword: string;

  fetchProposals: (reset?: boolean) => Promise<void>;
  fetchProposalById: (id: string) => Promise<Proposal | null>;
  fetchComments: (proposalId: string) => Promise<void>;
  addComment: (proposalId: string, content: string) => Promise<void>;
  vote: (proposalId: string, voteType: VoteType) => Promise<void>;
  getUserVote: (proposalId: string) => VoteType;
  createProposal: (data: Omit<Proposal, 'id' | 'upVotes' | 'downVotes' | 'commentCount' | 'createdAt' | 'updatedAt' | 'authorAvatar'>) => Promise<Proposal>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<Proposal | undefined>;
  deleteProposal: (id: string) => Promise<boolean>;
  togglePin: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ProposalStatus) => Promise<void>;
  setCategory: (category: ProposalCategory | undefined) => void;
  setStatus: (status: ProposalStatus | undefined) => void;
  setKeyword: (keyword: string) => void;
  loadMore: () => Promise<void>;
  resetFilters: () => void;
}

const getCurrentUser = () => {
  const userStr = localStorage.getItem('creative_current_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      // ignore
    }
  }
  return { id: 'anonymous', name: '访客' };
};

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [],
  currentProposal: null,
  comments: [],
  userVotes: {},
  loading: false,
  hasMore: true,
  total: 0,
  page: 1,
  pageSize: 10,
  category: undefined,
  status: undefined,
  keyword: '',

  fetchProposals: async (reset = false) => {
    set({ loading: true });
    const { pageSize, category, status, keyword } = get();
    const page = reset ? 1 : get().page;
    
    const result: PaginationResult<Proposal> = proposalService.getProposals({
      page,
      pageSize,
      category,
      status,
      keyword,
    });

    const votes: Record<string, VoteType> = {};
    result.data.forEach(p => {
      votes[p.id] = proposalService.getUserVote(p.id);
    });

    set({
      proposals: reset ? result.data : [...get().proposals, ...result.data],
      hasMore: result.hasMore,
      total: result.total,
      page,
      loading: false,
      userVotes: { ...get().userVotes, ...votes },
    });
  },

  fetchProposalById: async (id: string) => {
    const proposal = proposalService.getProposalById(id);
    if (proposal) {
      const vote = proposalService.getUserVote(id);
      set(state => ({
        currentProposal: proposal,
        userVotes: { ...state.userVotes, [id]: vote },
      }));
      return proposal;
    }
    set({ currentProposal: null });
    return null;
  },

  fetchComments: async (proposalId: string) => {
    const comments = proposalService.getComments(proposalId);
    set({ comments });
  },

  addComment: async (proposalId: string, content: string) => {
    const user = getCurrentUser();
    const comment = proposalService.addComment(proposalId, user.id, user.name, content);
    
    set(state => ({
      comments: [comment, ...state.comments],
    }));

    set(state => {
      const proposal = state.proposals.find(p => p.id === proposalId);
      if (proposal) {
        return {
          proposals: state.proposals.map(p =>
            p.id === proposalId ? { ...p, commentCount: p.commentCount + 1 } : p
          ),
          currentProposal: state.currentProposal?.id === proposalId
            ? { ...state.currentProposal, commentCount: state.currentProposal.commentCount + 1 }
            : state.currentProposal,
        };
      }
      return state;
    });
  },

  vote: async (proposalId: string, voteType: VoteType) => {
    const { proposal } = proposalService.vote(proposalId, voteType);
    
    if (proposal) {
      set(state => ({
        proposals: state.proposals.map(p =>
          p.id === proposalId ? { ...p, upVotes: proposal.upVotes, downVotes: proposal.downVotes } : p
        ),
        currentProposal: state.currentProposal?.id === proposalId
          ? { ...state.currentProposal, upVotes: proposal.upVotes, downVotes: proposal.downVotes }
          : state.currentProposal,
        userVotes: { ...state.userVotes, [proposalId]: voteType },
      }));
    }
  },

  getUserVote: (proposalId: string) => {
    return get().userVotes[proposalId] || null;
  },

  createProposal: async (data) => {
    const user = getCurrentUser();
    const proposal = proposalService.createProposal({
      ...data,
      authorId: user.id,
      authorName: user.name,
    });
    set(state => ({
      proposals: [proposal, ...state.proposals],
      total: state.total + 1,
    }));
    return proposal;
  },

  updateProposal: async (id: string, updates: Partial<Proposal>) => {
    const updated = proposalService.updateProposal(id, updates);
    if (updated) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? updated : p),
        currentProposal: state.currentProposal?.id === id ? updated : state.currentProposal,
      }));
    }
    return updated;
  },

  deleteProposal: async (id: string) => {
    const success = proposalService.deleteProposal(id);
    if (success) {
      set(state => ({
        proposals: state.proposals.filter(p => p.id !== id),
        total: state.total - 1,
        currentProposal: state.currentProposal?.id === id ? null : state.currentProposal,
      }));
    }
    return success;
  },

  togglePin: async (id: string) => {
    const updated = proposalService.togglePin(id);
    if (updated) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? updated : p),
        currentProposal: state.currentProposal?.id === id ? updated : state.currentProposal,
      }));
    }
  },

  updateStatus: async (id: string, status: ProposalStatus) => {
    const updated = proposalService.updateStatus(id, status);
    if (updated) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? updated : p),
        currentProposal: state.currentProposal?.id === id ? updated : state.currentProposal,
      }));
    }
  },

  setCategory: (category) => {
    set({ category, page: 1 });
    get().fetchProposals(true);
  },

  setStatus: (status) => {
    set({ status, page: 1 });
    get().fetchProposals(true);
  },

  setKeyword: (keyword) => {
    set({ keyword, page: 1 });
    get().fetchProposals(true);
  },

  loadMore: async () => {
    const { loading, hasMore } = get();
    if (loading || !hasMore) return;
    
    set(state => ({ page: state.page + 1 }));
    await get().fetchProposals(false);
  },

  resetFilters: () => {
    set({ category: undefined, status: undefined, keyword: '', page: 1 });
    get().fetchProposals(true);
  },
}));
