import type { CardGroup, CardGroupSummary } from './card';

export interface CreateGroupPayload {
  name: string;
  cards: Array<{ front: string; back: string }>;
  owner: string;
}

export interface CreateGroupResult {
  id: string;
  group: CardGroup;
}

export interface ReviewFeedback {
  groupId: string;
  feedback: 1 | 2 | 3;
}

export interface ReviewResult {
  card: {
    id: string;
    memoryLevel: number;
    nextReviewDate: string;
  };
  reviewedToday: number;
  currentIndex: number;
}

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().then(
      data => Promise.reject(new Error(data?.error || `HTTP ${res.status}`)),
      () => Promise.reject(new Error(`HTTP ${res.status}`))
    );
  }
  return res.json() as Promise<T>;
}

function apiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json'
  };
}

export async function createGroup(payload: CreateGroupPayload): Promise<CreateGroupResult> {
  const res = await fetch('/api/cardgroups', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<CreateGroupResult>(res);
}

export async function getGroup(id: string): Promise<CardGroup> {
  const res = await fetch(`/api/cardgroups/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: apiHeaders()
  });
  return handleResponse<CardGroup>(res);
}

export async function listGroups(): Promise<{ groups: CardGroupSummary[] }> {
  const res = await fetch('/api/cardgroups', {
    method: 'GET',
    headers: apiHeaders()
  });
  return handleResponse<{ groups: CardGroupSummary[] }>(res);
}

export async function updateCardReview(cardId: string, payload: ReviewFeedback): Promise<ReviewResult> {
  const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}/review`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<ReviewResult>(res);
}

export async function updateGroupIndex(groupId: string, index: number): Promise<{ ok: boolean; currentIndex: number }> {
  const res = await fetch(`/api/cardgroups/${encodeURIComponent(groupId)}/index`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ index })
  });
  return handleResponse<{ ok: boolean; currentIndex: number }>(res);
}
