export interface TeamMember {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Comment {
  id: string;
  taskId: string;
  author: TeamMember;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  assignee: TeamMember;
  color: string;
  createdAt: string;
  comments: Comment[];
  order: number;
}

export type TaskStatus = 'todo' | 'inProgress' | 'done';
