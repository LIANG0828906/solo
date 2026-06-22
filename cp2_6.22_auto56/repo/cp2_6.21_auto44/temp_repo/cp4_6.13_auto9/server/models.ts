export interface User {
  id: string;
  username: string;
  avatar: string;
  role: 'admin' | 'member';
  teamId: string;
}

export interface Board {
  id: string;
  name: string;
  teamId: string;
  swimLanes: SwimLane[];
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

export interface BoardWithTasks extends Board {
  tasks: Task[];
}

export interface TaskDetail extends Task {
  comments: Comment[];
  activityLogs: ActivityLog[];
  attachments: Attachment[];
}
