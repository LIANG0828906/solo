export type ThemeId = 'orange' | 'green' | 'blue' | 'pink';

export interface Theme {
  id: ThemeId;
  name: string;
  primaryColor: string;
  bgColors: string[];
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Family {
  id: string;
  name: string;
  theme: ThemeId;
  shareCode: string;
  members: Member[];
  createdAt: string;
  lastRecordAt: string | null;
}

export type MoodId = 'happy' | 'touched' | 'surprised' | 'warm' | 'funny';

export interface Mood {
  id: MoodId;
  name: string;
  emoji: string;
  color: string;
}

export interface Comment {
  id: string;
  memberId: string;
  memberName: string;
  content: string;
  createdAt: string;
}

export interface Record {
  id: string;
  familyId: string;
  memberId: string;
  memberName: string;
  memberAvatarColor: string;
  content: string;
  imageUrl: string | null;
  mood: MoodId;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: string;
}

export interface WeeklyReport {
  familyId: string;
  weekStart: string;
  weekEnd: string;
  records: Record[];
  moodStats: Record<MoodId, number>;
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  hasMore: boolean;
}

export interface LikeResponse {
  likes: number;
  liked: boolean;
}

export interface CreateFamilyRequest {
  name: string;
  theme: ThemeId;
  creatorName: string;
}

export interface JoinFamilyRequest {
  shareCode: string;
  memberName: string;
}

export interface CreateRecordRequest {
  content: string;
  mood: MoodId;
  memberId: string;
  memberName: string;
  memberAvatarColor: string;
  image?: File;
}

export interface AddCommentRequest {
  memberId: string;
  memberName: string;
  content: string;
}

export interface LikeRequest {
  memberId: string;
}
