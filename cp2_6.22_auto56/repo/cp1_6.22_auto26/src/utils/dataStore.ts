import type { RecipeBoard, RecipeCard, BoardData } from '../types';

const API_BASE = '/api';

export async function fetchBoards(): Promise<RecipeBoard[]> {
  const res = await fetch(`${API_BASE}/boards`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function fetchBoard(boardId: string): Promise<BoardData> {
  const res = await fetch(`${API_BASE}/boards/${boardId}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function createBoard(name: string): Promise<RecipeBoard> {
  const res = await fetch(`${API_BASE}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function updateBoard(boardId: string, data: Partial<RecipeBoard>): Promise<RecipeBoard> {
  const res = await fetch(`${API_BASE}/boards/${boardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update board');
  return res.json();
}

export async function deleteBoard(boardId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/boards/${boardId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete board');
}

export async function createCard(boardId: string, data: Omit<RecipeCard, 'id' | 'order' | 'boardId'>): Promise<RecipeCard> {
  const res = await fetch(`${API_BASE}/boards/${boardId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create card');
  return res.json();
}

export async function updateCard(cardId: string, data: Partial<RecipeCard>): Promise<RecipeCard> {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function deleteCard(cardId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete card');
}

export async function moveCard(cardId: string, toBoardId: string, newIndex: number): Promise<{ card: RecipeCard; fromBoardId: string; toBoardId: string }> {
  const res = await fetch(`${API_BASE}/cards/${cardId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toBoardId, newIndex }),
  });
  if (!res.ok) throw new Error('Failed to move card');
  return res.json();
}
