export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  isbn: string;
  addedAt: string;
  totalChapters: number;
  readerIds: string[];
}

export type ReadingStatus = 'not_started' | 'reading' | 'completed';

export interface ReadingProgress {
  memberId: string;
  bookId: string;
  currentChapter: number;
  totalChapters: number;
  status: ReadingStatus;
  lastUpdateAt: string;
}

export interface CheckIn {
  id: string;
  memberId: string;
  bookId: string;
  chapter: number;
  thought: string;
  createdAt: string;
}

export interface Reply {
  id: string;
  topicId: string;
  memberId: string;
  content: string;
  mentionIds: string[];
  createdAt: string;
}

export interface Topic {
  id: string;
  bookId: string;
  title: string;
  creatorId: string;
  repliesCount: number;
  lastReplyAt: string;
  createdAt: string;
  replies: Reply[];
}

export type EventStatus = 'suggested' | 'scheduled' | 'completed';

export interface Vote {
  memberId: string;
  timeOption: string;
  votedAt: string;
}

export interface Event {
  id: string;
  bookId: string;
  chapterRange: string;
  suggestedTime: string;
  adjustedTime?: string;
  status: EventStatus;
  timeOptions: string[];
  votes: Vote[];
  createdAt: string;
}

export interface BookWithReaders extends Book {
  readers: Member[];
}

export interface BookDetail extends Book {
  readers: Member[];
  progress: ReadingProgress[];
  checkIns: CheckIn[];
  topics: Omit<Topic, 'replies'>[];
}

export interface TopicDetail extends Topic {
  creator: Member;
  replyDetails: (Reply & { member: Member; mentions: Member[] })[];
}
