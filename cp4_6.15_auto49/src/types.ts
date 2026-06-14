export interface Person {
  id: string;
  name: string;
  birthday: string;
  interests: string[];
  avatarColor: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  personId: string;
  daysBefore: number;
  enabled: boolean;
}

export interface GiftIdea {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  platforms: string[];
  gradient: string;
}

export interface FormErrors {
  name?: string;
  birthday?: string;
  interests?: string;
}

export const INTEREST_TAGS = [
  '阅读', '旅行', '烹饪', '游戏', '运动',
  '音乐', '摄影', '手工', '宠物', '科技'
] as const;

export type InterestTag = typeof INTEREST_TAGS[number];
