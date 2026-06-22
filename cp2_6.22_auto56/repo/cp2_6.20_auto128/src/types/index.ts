export type ClubCategory = 'academic' | 'sports' | 'arts' | 'charity';
export type ActivityFrequency = 'weekly' | 'biweekly' | 'monthly';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Member {
  id: number;
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface Activity {
  id: number;
  name: string;
  date: string;
  location: string;
  registered: number;
  maxCapacity: number;
}

export interface Club {
  id: number;
  name: string;
  logo: string;
  cover: string;
  category: ClubCategory;
  slogan: string;
  description: string;
  activityFrequency: ActivityFrequency;
  memberCount: number;
  maxMembers: number;
  requiresReason: boolean;
  activities: Activity[];
  members: Member[];
}

export interface ClubListQuery {
  category?: ClubCategory | 'all';
  frequency?: ActivityFrequency | 'all';
}

export interface UserApplication {
  id: number;
  clubId: number;
  clubName: string;
  status: ApplicationStatus;
  appliedAt: string;
  memberCount: number;
}

export interface ApplyRequest {
  clubId: number;
  reason?: string;
}
