export type Category = '手机' | '钱包' | '校园卡' | '书籍' | '水杯' | '其他';

export type ColorKey = '红色' | '蓝色' | '绿色' | '黄色' | '黑色' | '白色';

export type ItemStatus = 'pending' | 'matched' | 'completed';

export interface Item {
  id: string;
  type: 'lost' | 'found';
  name: string;
  category: Category;
  colors: ColorKey[];
  location: string;
  description: string;
  imageUrl?: string;
  createdAt: number;
  status: ItemStatus;
  anonymousId: string;
}

export interface ScoreBreakdown {
  category: number;
  colors: number;
  location: number;
  description: number;
}

export interface MatchResult {
  id: string;
  lostItem: Item;
  foundItem: Item;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  createdAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
  messagesSentToday: Record<string, number>;
  messages: Message[];
}

export interface ToastNotification {
  id: string;
  itemName: string;
  timestamp: number;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  '手机': '#4FC3F7',
  '钱包': '#FF8C00',
  '校园卡': '#81C784',
  '书籍': '#CE93D8',
  '水杯': '#4DB6AC',
  '其他': '#BDBDBD'
};

export const COLOR_PALETTE: Record<ColorKey, string> = {
  '红色': '#E53935',
  '蓝色': '#4FC3F7',
  '绿色': '#81C784',
  '黄色': '#FFD54F',
  '黑色': '#333333',
  '白色': '#FFFFFF'
};

export const CATEGORIES: Category[] = ['手机', '钱包', '校园卡', '书籍', '水杯', '其他'];

export const COLORS: ColorKey[] = ['红色', '蓝色', '绿色', '黄色', '黑色', '白色'];

export const LOCATION_SUGGESTIONS = [
  '教学楼A', '教学楼B', '图书馆', '食堂一楼', '食堂二楼',
  '操场', '体育馆', '宿舍1号楼', '宿舍2号楼', '宿舍3号楼',
  '行政楼', '实验楼', '校医院', '南门', '北门', '东门', '西门',
  '篮球场', '停车场', '快递站'
];
