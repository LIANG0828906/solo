export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  deadline: number | null;
  createdAt: number;
  endedAt: number | null;
  isEnded: boolean;
  creatorDeviceId: string;
}

export interface VoteRecord {
  pollId: string;
  optionId: string;
  deviceId: string;
  timestamp: number;
}

export type View =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'vote'; pollId: string };
