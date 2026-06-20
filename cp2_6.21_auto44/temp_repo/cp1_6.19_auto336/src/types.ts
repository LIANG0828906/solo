export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Member {
  userId: string;
  userName: string;
  userAvatar: string;
  paymentStatus: 'pending' | 'paid' | 'received';
  shareAmount: number;
}

export interface MatchRule {
  minAmount?: number;
  maxMembers?: number;
  autoRejectBelow?: number;
}

export interface Order {
  id: string;
  title: string;
  type: 'shopping' | 'carpool' | 'food';
  totalAmount: number;
  targetMembers: number;
  currentMembers: number;
  deadline: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  members: Member[];
  status: 'active' | 'completed' | 'archived';
  matchRule?: MatchRule;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system';
}

export interface Notification {
  id: string;
  content: string;
  timestamp: string;
}
