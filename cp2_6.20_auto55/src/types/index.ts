export type VoteType = 'single' | 'multiple' | 'rank' | 'score';

export type VoteStatus = 'todo' | 'active' | 'ended';

export interface VoteOption {
  id: string;
  text: string;
  votes: number;
  rankSum?: number;
  rankCount?: number;
  avgRank?: number;
  scoreSum?: number;
  scoreCount?: number;
  avgScore?: number;
}

export interface VoteSelection {
  optionId: string;
  rank?: number;
  score?: number;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  type: VoteType;
  options: VoteOption[];
  isAnonymous: boolean;
  deadline: string;
  maxVoters: number;
  currentVoters: number;
  status: VoteStatus;
  createdAt: string;
  createdBy: string;
  maxScore?: number;
}

export interface VoteRecord {
  id: string;
  voteId: string;
  userId: string;
  userName: string;
  selections: VoteSelection[];
  submittedAt: string;
}

export interface Notification {
  id: string;
  type: 'vote_created' | 'vote_ended' | 'vote_result';
  title: string;
  message: string;
  voteId?: string;
  read: boolean;
  createdAt: string;
}

export interface CreateVoteRequest {
  title: string;
  description: string;
  type: VoteType;
  options: string[];
  isAnonymous: boolean;
  deadline: string;
  maxVoters: number;
  maxScore?: number;
}

export interface UpdateVoteRequest {
  title?: string;
  description?: string;
  type?: VoteType;
  options?: string[];
  isAnonymous?: boolean;
  deadline?: string;
  maxVoters?: number;
  maxScore?: number;
  status?: VoteStatus;
}

export interface SubmitVoteRequest {
  selections: VoteSelection[];
  userId: string;
  userName: string;
}

export interface VoteFilters {
  search: string;
  type: VoteType | null;
  status: VoteStatus | null;
  sortBy: string;
}
