export interface SongOption {
  id: string;
  title: string;
  voteCount: number;
  color: string;
}

export interface VoteEvent {
  roomId: string;
  songId: string;
  userId: string;
  timestamp: number;
}

export interface RoomState {
  id: string;
  name: string;
  songs: SongOption[];
  durationSeconds: number;
  remainingSeconds: number;
  votingLocked: boolean;
  winnerSongId: string | null;
  createdAt: number;
  userVotes: Record<string, string>;
  totalVoters: number;
}

export interface TrendDataPoint {
  timestamp: number;
  votes: Record<string, number>;
}

export interface CreateRoomRequest {
  name: string;
  songs: string[];
  durationMinutes: number;
}

export interface CreateRoomResponse {
  roomId: string;
  shareUrl: string;
}

export type TimeStatus = 'green' | 'yellow' | 'red';
