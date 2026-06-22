export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export type AgendaStatus = 'pending' | 'discussing' | 'resolved' | 'postponed';

export interface Vote {
  userId: string;
  type: 'agree' | 'disagree' | 'abstain';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  content: string;
  timestamp: number;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  responsible: string;
  duration: number;
  status: AgendaStatus;
  order: number;
  comments: Comment[];
  votes: Vote[];
  resolution?: string;
  todo?: string;
  todoDueDate?: string;
  todoPriority?: 'high' | 'medium' | 'low';
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  participants: User[];
  agendaItems: AgendaItem[];
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  meetingId: string;
  meetingTitle: string;
  agendaItemId: string;
  responsible: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  createdAt: number;
}

export interface WebSocketMessage {
  type: 'comment' | 'vote' | 'status_change' | 'agenda_order' | 'join' | 'leave';
  meetingId: string;
  data: unknown;
  userId: string;
  timestamp: number;
}

export interface CommentMessageData {
  agendaItemId: string;
  comment: Comment;
}

export interface VoteMessageData {
  agendaItemId: string;
  vote: Vote;
}

export interface StatusChangeMessageData {
  agendaItemId: string;
  status: AgendaStatus;
}

export interface AgendaOrderMessageData {
  itemIds: string[];
}
