export interface VoteOption {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface VoteCreateData {
  title: string;
  description: string;
  options: VoteOption[];
}

export interface VoteData {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdAt: string;
}

export interface OptionWeight {
  optionId: string;
  score: number;
}

export interface WeightSubmission {
  voteId: string;
  voterId: string;
  weights: Record<string, number>;
}

export interface OptionDistribution {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  values: number[];
}

export interface RankingItem {
  optionId: string;
  name: string;
  totalScore: number;
  averageScore: number;
  rank: number;
  count: number;
  distribution: OptionDistribution;
}

export interface RankingUpdateData {
  rankings: RankingItem[];
  voteId: string;
}
