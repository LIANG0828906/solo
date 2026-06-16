export type HighlightColor = 'yellow' | 'green' | 'pink';

export interface Club {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: number;
  currentBookId: string | null;
  currentChapter: number;
  memberIds: string[];
  hostId: string;
}

export interface Book {
  id: string;
  title: string;
  totalChapters: number;
  description: string;
  coverSeed: number;
  clubId: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: string;
}

export interface Member {
  id: string;
  name: string;
  clubId: string;
  joinedAt: number;
  isHost: boolean;
  avatarSeed: number;
}

export interface Highlight {
  id: string;
  chapterId: string;
  memberId: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  text: string;
  createdAt: number;
}

export interface Note {
  id: string;
  highlightId: string;
  memberId: string;
  content: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  chapterId: string;
  memberId: string;
  highlightId: string | null;
  parentId: string | null;
  content: string;
  createdAt: number;
}

export interface Poll {
  id: string;
  clubId: string;
  title: string;
  options: PollOption[];
  status: 'active' | 'ended';
  createdBy: string;
  createdAt: number;
  endsAt: number;
}

export interface PollOption {
  id: string;
  bookTitle: string;
  description: string;
  voteCount: number;
  colorIndex: number;
}

export interface Vote {
  id: string;
  pollId: string;
  memberId: string;
  optionId: string;
  votedAt: number;
}

export interface UserStats {
  highlightCount: number;
  commentCount: number;
  voteCount: number;
  activityDates: string[];
  dailyComments: { date: string; count: number }[];
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}
