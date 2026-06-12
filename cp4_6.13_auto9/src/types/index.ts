export interface User {
  id: string;
  username: string;
  avatar: string;
  role: 'admin' | 'member';
  teamId: string;
}

export interface SwimLane {
  id: string;
  name: string;
  boardId: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  dueDate: string;
  swimLaneId: string;
  boardId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface TaskDetail extends Task {
  comments: Comment[];
  activityLogs: ActivityLog[];
  attachments: Attachment[];
}

export interface Board {
  id: string;
  name: string;
  teamId: string;
  swimLanes: SwimLane[];
  tasks: Task[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface FilterState {
  assigneeId: string;
  priority: string;
  dueDate: string;
}
