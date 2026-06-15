export interface User {
  id: number;
  name: string;
  avatarColor: string;
  rating: number;
  badge: 'bronze' | 'silver' | 'gold';
  reviewCount: number;
  lat: number;
  lng: number;
}

export interface WeekSlot {
  day: number;
  startHour: number;
  endHour: number;
}

export interface Skill {
  id: number;
  userId: number;
  category: string;
  title: string;
  description: string;
  availability: string | WeekSlot[];
  radius: number;
  user?: User;
  distance?: number;
}

export interface Exchange {
  id: number;
  skillId: number;
  fromUserId: number;
  toUserId: number;
  scheduledDate: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  skill?: Skill;
  fromUser?: User;
  toUser?: User;
}

export interface Review {
  id: number;
  exchangeId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export const CATEGORIES = ['维修', '教育', '烹饪', '园艺'];

export const CATEGORY_COLORS: Record<string, string> = {
  '维修': '#8B4513',
  '教育': '#2E86AB',
  '烹饪': '#D4A574',
  '园艺': '#4A6741',
};

export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
