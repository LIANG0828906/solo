export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  inviteCode: string;
  creatorId: string;
  createdAt: string;
  memberIds: string[];
  pinnedMessageId?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  estimatedHours: number;
  order: number;
  createdAt: string;
  lastCheckinAt?: string;
}

export interface Checkin {
  id: string;
  taskId: string;
  userId: string;
  progress: string;
  difficulties: string;
  createdAt: string;
  durationHours: number;
}

export interface Message {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: string;
  isPinned: boolean;
}
