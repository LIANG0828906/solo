export type ReadingStatus = 'unread' | 'reading' | 'finished20' | 'finished50';

export interface CheckIn {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  date: string;
  status: ReadingStatus;
  pages: number;
  note?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  description: string;
  inviteCode: string;
  organizerId: string;
  members: Member[];
  checkIns: CheckIn[];
  createdAt: string;
  ended: boolean;
}

export interface ReportData {
  activityId: string;
  totalDays: number;
  totalPages: number;
  longestStreak: number;
  memberCompletion: Array<{
    memberId: string;
    memberName: string;
    memberAvatar: string;
    completionRate: number;
    totalPages: number;
  }>;
}
