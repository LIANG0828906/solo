export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar_color: string;
  exchange_count: number;
  trust_count: number;
  created_at: string;
}

export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  image_url: string;
  category: string;
  description: string;
  created_at: string;
  distance: number;
  user?: User;
  is_exchanged: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface TrustMark {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}
