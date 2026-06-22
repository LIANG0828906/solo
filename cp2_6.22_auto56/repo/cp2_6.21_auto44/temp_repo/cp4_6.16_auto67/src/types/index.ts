export type WorkStatus = 'draft' | 'published';

export type MilestoneType = 'writing' | 'arrangement' | 'recording' | 'mixing' | 'release';

export interface Milestone {
  id: string;
  workId: string;
  type: MilestoneType;
  title: string;
  description: string;
  date: string;
}

export interface Work {
  id: string;
  title: string;
  lyrics: string;
  createdAt: string;
  status: WorkStatus;
  audioBase64: string;
  audioDuration: number;
  milestones: Milestone[];
  coverColor: string;
}

export interface Vote {
  id: string;
  workId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface VoteStats {
  averageScore: number;
  totalVotes: number;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentWorkId: string | null;
}

export interface AppState {
  works: Work[];
  votes: Vote[];
  selectedWorkId: string | null;
  expandedMilestoneId: string | null;
  isLoading: boolean;
  filterStatus: WorkStatus | 'all';
  dateRange: { start: string | null; end: string | null };
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentWorkId: string | null;
  progress: number;
}
