export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ImageData {
  id: string;
  url: string;
  filename: string;
}

export interface Step {
  order: number;
  description: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  itemId: string;
  itemName: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  contactInfo?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'exchange_request' | 'exchange_accepted' | 'exchange_rejected';
  content: string;
  relatedItemId?: string;
  relatedRequestId?: string;
  read: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  userId: string;
  username: string;
  name: string;
  difficulty: Difficulty;
  tools: string[];
  steps: Step[];
  experience: string;
  beforeImages: ImageData[];
  afterImages: ImageData[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  contactInfo?: string;
}

export interface UploadRecord {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  createdAt: string;
}

export interface CreateItemRequest {
  name: string;
  difficulty: Difficulty;
  tools: string[];
  steps: Step[];
  experience: string;
  beforeImageIds: string[];
  afterImageIds: string[];
}

export interface AddCommentRequest {
  content: string;
}

export interface ExchangeRequestPayload {
  message?: string;
}

export interface ExchangeResponsePayload {
  accepted: boolean;
  contactInfo?: string;
}

export interface LoginRequest {
  username: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Database {
  users: User[];
  items: Item[];
  exchangeRequests: ExchangeRequest[];
  notifications: Notification[];
  uploads: UploadRecord[];
}
