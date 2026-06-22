export interface VoteOption {
  id: string;
  text: string;
  votes: number;
  color: string;
}

export interface VoteOptionResult extends VoteOption {
  percentage: number;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  multiSelect: boolean;
  endTime: number;
  createdAt: number;
  isActive: boolean;
  remainingTime: number;
}

export interface VoteListItem {
  id: string;
  title: string;
  optionCount: number;
  remainingTime: number;
  isActive: boolean;
}

export interface VoteResult {
  voteId: string;
  title: string;
  totalVotes: number;
  remainingTime: number;
  isActive: boolean;
  results: VoteOptionResult[];
}

export interface CreateVoteRequest {
  title: string;
  description: string;
  options: string[];
  multiSelect: boolean;
  durationMinutes: number;
}

export interface SubmitVoteRequest {
  optionIds: string[];
}

export type PageType = 'list' | 'vote' | 'result';
