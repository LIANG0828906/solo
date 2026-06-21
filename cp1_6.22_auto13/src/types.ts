export type VoteType = 'single' | 'multiple' | 'rating';

export interface VoteOption {
  id: string;
  text: string;
}

export interface VoteResult {
  optionId: string;
  count: number;
}

export interface RatingResult {
  rating: number;
  count: number;
}

export interface Vote {
  id: string;
  type: VoteType;
  question: string;
  options: VoteOption[];
  isActive: boolean;
  createdAt: number;
  results: VoteResult[];
  ratingResults?: RatingResult[];
}

export interface VoteSubmission {
  voteId: string;
  selectedOptionIds?: string[];
  rating?: number;
  participantId: string;
}

export interface WSMessage {
  type: 'start_vote' | 'end_vote' | 'submit_vote' | 'vote_update' | 'init' | 'vote_list';
  payload: any;
}
