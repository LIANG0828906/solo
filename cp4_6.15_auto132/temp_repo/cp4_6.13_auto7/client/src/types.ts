export interface User {
  id: string;
  username: string;
  password?: string;
  avatar: string;
  bio: string;
  location: { lat: number; lng: number };
  tastePrefs: {
    spiciness: 0 | 1 | 2 | 3;
    cuisines: string[];
    restrictions: string[];
  };
  availableSlots: ('breakfast' | 'lunch' | 'dinner' | 'supper')[];
  deliveryRadius: number;
  createdAt: number;
}

export interface MealComment {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
}

export interface Meal {
  id: string;
  publisherId: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  servings: number;
  remainingServings: number;
  location: { lat: number; lng: number };
  address: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'supper';
  expiresAt: number;
  createdAt: number;
  likes: string[];
  comments: MealComment[];
  publisher?: User;
  matchScore?: number;
}

export interface MatchRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  mealId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  meal?: Meal;
  requester?: User;
  receiver?: User;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  type: 'text' | 'emoji' | 'image';
  content: string;
  createdAt: number;
  readBy: string[];
}

export interface Chat {
  id: string;
  requestId: string;
  participants: string[];
  expiresAt: number;
  messages: ChatMessage[];
  partner?: User;
  unreadCount?: number;
}

export type WSMessage =
  | { type: 'MEAL_PUSH'; meal: Meal; matchScore: number }
  | { type: 'NEW_MESSAGE'; chatId: string; message: ChatMessage }
  | { type: 'MESSAGE_READ'; chatId: string; messageId: string; readerId: string }
  | { type: 'MATCH_REQUEST'; request: MatchRequest }
  | { type: 'REQUEST_ACCEPTED'; chatId: string; partner: User }
  | { type: 'NOTIFICATION'; title: string; body: string };
