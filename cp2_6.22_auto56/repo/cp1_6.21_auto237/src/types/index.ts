export interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  type: 'lost' | 'found';
  location: string;
  description: string;
  contact: string;
  username: string;
  createdAt: string;
  comments: Comment[];
}

export interface MatchedItem extends Item {
  matchScore: number;
}

export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error';
}
