export type ActivityStatus = 'upcoming' | 'ongoing' | 'ended';
export type CheckInStatus = 'registered' | 'checked-in';

export interface Activity {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  quota: number;
  registrationDeadline: string;
  inviteCode: string;
  status: ActivityStatus;
  createdAt: string;
}

export interface Participant {
  id: string;
  activityId: string;
  name: string;
  email: string;
  checkInStatus: CheckInStatus;
  qrCode: string;
  registeredAt: string;
  checkedInAt?: string;
}

export interface Comment {
  id: string;
  activityId: string;
  authorName: string;
  content: string;
  parentId?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface MonthlyStats {
  month: string;
  participants: number;
  checkInRate: number;
}

export interface DashboardStats {
  totalActivities: number;
  totalRegistrations: number;
  averageCheckInRate: number;
  monthlyData: MonthlyStats[];
}

export interface CreateActivityRequest {
  name: string;
  date: string;
  location: string;
  description: string;
  quota: number;
  registrationDeadline: string;
}

export interface RegisterRequest {
  inviteCode: string;
  name: string;
  email: string;
}

export interface CheckInRequest {
  participantId: string;
}

export interface CreateCommentRequest {
  authorName: string;
  content: string;
  parentId?: string;
}

export interface LikeRequest {
  userName: string;
}

export interface LikeResponse {
  likes: number;
  liked: boolean;
}
