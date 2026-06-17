export type ProficiencyLevel = '初级' | '中级' | '高级';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export type TimeSlotLabel = {
  [key: string]: { label: string; hours: string };
};

export const TIME_SLOT_CONFIG: TimeSlotLabel = {
  morning: { label: '早间', hours: '8-12点' },
  afternoon: { label: '下午', hours: '13-17点' },
  evening: { label: '晚间', hours: '19-23点' }
};

export interface Skill {
  id: string;
  name: string;
  level: ProficiencyLevel;
  timeSlots: TimeSlot[];
  userId: string;
  createdAt: number;
}

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
}

export interface MatchResult {
  userId: string;
  user: User;
  skill: Skill;
  score: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Checkin {
  id: string;
  userId: string;
  skillId: string;
  date: string;
  duration: number;
  notes: string;
  createdAt: number;
}

export interface WeeklyPlan {
  id: string;
  skillId: string;
  skillName: string;
  dailyTargets: Record<string, number>;
  createdAt: number;
}

export interface BuddyPair {
  id: string;
  userId: string;
  buddyId: string;
  skillId: string;
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppState {
  currentUser: User;
  skills: Skill[];
  users: User[];
  matches: MatchResult[];
  buddies: BuddyPair[];
  checkins: Checkin[];
  plans: WeeklyPlan[];
  toasts: Toast[];
}
