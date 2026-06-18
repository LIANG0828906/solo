export interface Meeting {
  id: string;
  title: string;
  agenda: string;
  attendees: string[];
  dateTime: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  meetingId: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  agenda: string;
  attendees: string[];
  dateTime: string;
}

export interface UpdateNotesRequest {
  notes: string;
}

export interface UpdateTodoRequest {
  status?: 'todo' | 'in-progress' | 'done';
  order?: number;
}

export interface ExtractedTodo {
  description: string;
  completed: boolean;
}

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
}

export type NetworkStatus = 'online' | 'offline';
