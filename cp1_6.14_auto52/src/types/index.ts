export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
}

export interface Tag {
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  replies: Comment[];
  parentId: string | null;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  tags: Tag[];
  likes: number;
  likedByMe: boolean;
  votes: number;
  votedByMe: boolean;
  totalVoters: number;
  images: string[];
  links: string[];
  comments: Comment[];
  commentCount: number;
  createdAt: string;
  status: 'draft' | 'active' | 'converted';
  taskId: string | null;
  hotScore: number;
}

export interface Task {
  id: string;
  ideaId: string;
  title: string;
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'in_progress' | 'done';
}

export type SortType = 'hot' | 'latest' | 'random';
