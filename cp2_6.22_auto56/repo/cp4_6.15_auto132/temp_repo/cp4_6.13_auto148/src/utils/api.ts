const API_BASE = '/api';

export interface Idea {
  id: string;
  room_code: string;
  title: string;
  description: string;
  author: string;
  tags: string;
  created_at: string;
  vote_count: number;
  comment_count: number;
}

export interface Comment {
  id: string;
  idea_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface TrendPoint {
  time_slot: string;
  vote_count: number;
}

export async function createIdea(roomCode: string, title: string, description: string, author: string, tags: string[]): Promise<Idea> {
  const res = await fetch(`${API_BASE}/ideas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_code: roomCode, title, description, author, tags }),
  });
  if (!res.ok) throw new Error('Failed to create idea');
  return res.json();
}

export async function getIdeas(roomCode: string): Promise<Idea[]> {
  const res = await fetch(`${API_BASE}/ideas?room_code=${encodeURIComponent(roomCode)}`);
  if (!res.ok) throw new Error('Failed to fetch ideas');
  return res.json();
}

export async function voteIdea(ideaId: string, voterName: string, roomCode: string): Promise<{ idea_id: string; vote_count: number }> {
  const res = await fetch(`${API_BASE}/ideas/${ideaId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter_name: voterName, room_code: roomCode }),
  });
  if (res.status === 409) throw new Error('Already voted');
  if (!res.ok) throw new Error('Failed to vote');
  return res.json();
}

export async function addComment(ideaId: string, author: string, content: string): Promise<{ comment: Comment; idea_id: string; comment_count: number }> {
  const res = await fetch(`${API_BASE}/ideas/${ideaId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, content }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

export async function getComments(ideaId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/ideas/${ideaId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function getRanking(roomCode: string): Promise<{ id: string; title: string; author: string; vote_count: number }[]> {
  const res = await fetch(`${API_BASE}/ranking?room_code=${encodeURIComponent(roomCode)}`);
  if (!res.ok) throw new Error('Failed to fetch ranking');
  return res.json();
}

export async function getTrend(roomCode: string): Promise<TrendPoint[]> {
  const res = await fetch(`${API_BASE}/trend?room_code=${encodeURIComponent(roomCode)}`);
  if (!res.ok) throw new Error('Failed to fetch trend');
  return res.json();
}
