export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface VoteRecord {
  optionId: string;
  timestamp: number;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  createdAt: number;
  deadline: number;
  isClosed: boolean;
  votes: VoteRecord[];
}

export interface OptionStat {
  optionId: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface PollStatistics {
  totalVotes: number;
  optionStats: OptionStat[];
  timelineData: TimelinePoint[];
}

export interface TimelinePoint {
  time: string;
  votes: number;
}
