export type BookCategory = '小说' | '非虚构' | '科技' | '生活' | '儿童';
export type BookCondition = '全新' | '良好' | '一般';
export type BookStatus = '在馆' | '借出' | '漂流' | '下架';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  category: BookCategory;
  condition: BookCondition;
  status: BookStatus;
  createdAt: number;
  tags?: string[];
}

export interface LendingRecord {
  recordId: string;
  bookId: string;
  borrowerName: string;
  borrowDate: number;
  dueDate: number;
  returnDate: number | null;
  isDrifting?: boolean;
  location?: string;
}

export interface CommunityEvent {
  eventId: string;
  title: string;
  description: string;
  date: number;
  location: string;
  maxAttendees: number;
  registeredIds: string[];
  createdAt: number;
}

export interface UserState {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

export interface DriftRoutePoint {
  borrowerName: string;
  date: number;
  location?: string;
}
