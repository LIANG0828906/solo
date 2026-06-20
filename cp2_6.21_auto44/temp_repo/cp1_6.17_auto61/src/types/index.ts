export type PreferenceType = 'available' | 'unavailable' | 'preferred';

export interface TimeOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface MemberVote {
  memberId: string;
  memberName: string;
  avatar: string;
  preferences: Record<string, PreferenceType>;
  votedAt: string;
}

export interface Poll {
  id: string;
  shortId: string;
  title: string;
  options: TimeOption[];
  deadline: string;
  createdAt: string;
  creatorName: string;
  votes: MemberVote[];
  members: Array<{ id: string; name: string; avatar: string }>;
}

export interface ScheduleResult {
  bestOption: TimeOption | null;
  bestScore: number;
  optionScores: Array<{ option: TimeOption; score: number; availableCount: number; preferredCount: number }>;
  totalMembers: number;
  satisfactionRating: number;
}

export interface CreatePollRequest {
  title: string;
  options: Array<{ date: string; startTime: string; endTime: string }>;
  deadline: string;
  creatorName: string;
  members: Array<{ name: string; avatar: string }>;
}

export interface SubmitVoteRequest {
  memberId: string;
  memberName: string;
  avatar: string;
  preferences: Record<string, PreferenceType>;
}
