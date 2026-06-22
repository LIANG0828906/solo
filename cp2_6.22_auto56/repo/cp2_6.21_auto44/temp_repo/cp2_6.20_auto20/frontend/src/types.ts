export interface VoteOption {
  id: string;
  text: string;
}

export interface Ranking {
  voterId: string;
  order: string[];
  timestamp: number;
}

export interface Vote {
  id: string;
  title: string;
  options: VoteOption[];
  deadline: number;
  isClosed: boolean;
  createdAt: number;
  rankings: Ranking[];
}

export interface CreateVoteRequest {
  title: string;
  options: string[];
  deadline: number;
}

export interface SubmitRankingRequest {
  voterId: string;
  order: string[];
}

export interface OptionScore {
  optionId: string;
  text: string;
  totalScore: number;
  averageRank: number;
  voteCount: number;
}
