export interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  user: string;
  content: string;
  createdAt: string;
}

export interface Like {
  id: string;
  projectId: string;
  user: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'like' | 'comment';
  projectId: string;
  projectTitle: string;
  user: string;
  content?: string;
  createdAt: string;
}

export interface ProjectStats {
  projectId: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  hasParticipated: boolean;
}

export interface FormErrors {
  title?: string;
  description?: string;
  images?: string;
}

export const CURRENT_USER = '张三';

export const MOCK_USERS = ['张三', '李四', '王五', '赵六', '孙七'];
