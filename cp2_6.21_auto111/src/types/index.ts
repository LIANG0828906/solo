export interface PollOption {
  id: number;
  text: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: PollOption[];
  createdAt: string;
  isMultipleChoice: boolean;
  totalVotes: number;
  creatorDeviceId: string;
}

export interface VoteRequest {
  optionIds: number[];
}

export interface VoteResponse {
  success: boolean;
  message: string;
  poll: Poll;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  options: string[];
  isMultipleChoice?: boolean;
}
