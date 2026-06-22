export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  points: number;
  reputation: number;
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: 'digital' | 'home' | 'books' | 'other';
  image: string;
  price: number;
  publisherId: string;
  publisher: User;
  status: 'available' | 'exchanged';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  publisherId: string;
  publisher: User;
  accepterId: string;
  accepter: User | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  publisherRating: number;
  accepterRating: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'item_exchange' | 'task_reward' | 'publish_bonus';
  fromUserId: string;
  toUserId: string;
  amount: number;
  itemId: string;
  taskId: string;
  description: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export type { User, Item, Task, Transaction, Activity };
