export interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  title: string;
  options: VoteOption[];
  createdAt: number;
}

export type SortType = 'time-desc' | 'votes-desc' | 'time-asc';
