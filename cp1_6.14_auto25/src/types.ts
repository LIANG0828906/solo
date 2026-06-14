export interface Preference {
  minAge: number;
  maxAge: number;
  targetCity: string;
  targetInterests: string[];
}

export interface User {
  id: string;
  nickname: string;
  birthYear: number;
  gender: 'male' | 'female';
  city: string;
  bio: string;
  interests: string[];
  preference: Preference;
  avatarColor: string;
  lastActive: string;
  createdAt: string;
}

export interface Heart {
  id: string;
  fromUserId: string;
  toUserId: string;
  timestamp: string;
}

export interface Match {
  id: string;
  userIds: [string, string];
  matchedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface RecommendResponse {
  users: User[];
  hasMore: boolean;
}

export interface SendHeartResponse {
  success: boolean;
  isMatch: boolean;
  match?: Match;
}

export interface ProfileFormData {
  nickname: string;
  birthYear: number;
  gender: 'male' | 'female';
  city: string;
  bio: string;
  interests: string[];
  preference: Preference;
}

export const AVATAR_COLORS = [
  '#FF6B6B', '#FF8E8E', '#FFB26B', '#FFD93D',
  '#6BCB77', '#4D96FF', '#9B59B6', '#E74C3C',
  '#1ABC9C', '#F39C12', '#3498DB', '#E91E63'
];

export const INTEREST_OPTIONS = [
  '音乐', '电影', '读书', '旅行', '摄影', '美食',
  '运动', '健身', '游戏', '动漫', '绘画', '写作',
  '烹饪', '园艺', '宠物', '手工', '舞蹈', '乐器',
  '登山', '潜水', '滑雪', '骑行', '瑜伽', '冥想'
];

export const CITY_OPTIONS = [
  '北京', '上海', '广州', '深圳', '杭州', '成都',
  '武汉', '南京', '西安', '重庆', '苏州', '天津',
  '长沙', '青岛', '大连', '厦门', '福州', '济南'
];
