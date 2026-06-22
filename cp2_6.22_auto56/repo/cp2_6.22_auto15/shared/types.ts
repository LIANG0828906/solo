export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  storyPoints: number;
  status: 'todo' | 'in-progress' | 'done';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dailyRemaining: BurndownPoint[];
}

export interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  taskTitle: string;
  timestamp: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  connectedAt: string;
}
