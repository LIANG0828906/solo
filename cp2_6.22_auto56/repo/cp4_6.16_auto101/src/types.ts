export interface User {
  id: string;
  username: string;
  description: string;
  avatarColor: string;
  createdAt: number;
  averageRating: number;
  reviewCount: number;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  description: string;
  tags: string[];
  createdAt: number;
}

export type SkillCategory = 'programming' | 'design' | 'language' | 'other';

export const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'programming', label: '编程' },
  { value: 'design', label: '设计' },
  { value: 'language', label: '语言' },
  { value: 'other', label: '其他' },
];

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  targetSkillId: string;
  offeredSkillId: string;
  message: string;
  status: ExchangeStatus;
  createdAt: number;
  updatedAt: number;
}

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Message {
  id: string;
  exchangeRequestId: string;
  senderId: string;
  content: string;
  timestamp: number;
  status: MessageStatus;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered';

export interface Review {
  id: string;
  exchangeRequestId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  content: string;
  createdAt: number;
}

export interface Conversation {
  exchangeRequestId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export type ChannelMessageType =
  | 'new_message'
  | 'request_status_change'
  | 'new_review';

export interface ChannelMessage {
  type: ChannelMessageType;
  payload: any;
  timestamp: number;
}
