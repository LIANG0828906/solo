export interface Room {
  id: string;
  name: string;
  topic: string;
  status: 'active' | 'ended';
  participants: number;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  side: 'pro' | 'con';
  content: string;
  timestamp: string;
  parentNodeId?: string;
}

export interface ArgumentNode {
  id: string;
  messageId: string;
  side: 'pro' | 'con';
  content: string;
  support: number;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'support' | 'refute';
}

export interface DebateReport {
  totalMessages: number;
  avgReplyDelay: number;
  supportTimeline: { time: string; pro: number; con: number }[];
  mostReplied: { nodeId: string; content: string; replyCount: number; side: string }[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchRooms(): Promise<Room[]> {
  return request<Room[]>('/api/rooms');
}

export async function createRoom(name: string, topic: string): Promise<Room> {
  return request<Room>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, topic }),
  });
}

export async function fetchRoom(roomId: string): Promise<Room> {
  return request<Room>(`/api/rooms/${roomId}`);
}

export async function fetchMessages(roomId: string): Promise<Message[]> {
  return request<Message[]>(`/api/rooms/${roomId}/messages`);
}

export async function fetchNodes(roomId: string): Promise<ArgumentNode[]> {
  return request<ArgumentNode[]>(`/api/rooms/${roomId}/nodes`);
}

export async function fetchConnections(roomId: string): Promise<Connection[]> {
  return request<Connection[]>(`/api/rooms/${roomId}/connections`);
}

export async function endDebate(roomId: string): Promise<Room> {
  return request<Room>(`/api/rooms/${roomId}/end`, { method: 'POST' });
}

export async function fetchReport(roomId: string): Promise<DebateReport> {
  return request<DebateReport>(`/api/rooms/${roomId}/report`);
}
