export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  avatarColor: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  onlineUsers: string[];
}

export interface BoardSummary {
  id: string;
  name: string;
  description: string;
  taskCount: number;
}

export type WsMessage =
  | { type: 'task-created'; task: Task }
  | { type: 'task-updated'; task: Task }
  | { type: 'comment-added'; taskId: string; comment: Comment }
  | { type: 'online-users'; users: string[] };
