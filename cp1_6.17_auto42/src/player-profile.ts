import type { Decision, PlayerProfile } from '@/types';

export async function createPlayer(nickname: string): Promise<{ id: string; nickname: string }> {
  const response = await fetch('/api/player/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  if (!response.ok) {
    throw new Error('Failed to create player');
  }
  return response.json();
}

export async function saveDecision(
  playerId: string,
  decision: Decision,
  currentNodeId: string,
  score: number,
): Promise<boolean> {
  const response = await fetch('/api/player/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, decision, currentNodeId, score }),
  });
  if (!response.ok) {
    throw new Error('Failed to save decision');
  }
  return response.json();
}

export async function fetchPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const response = await fetch(`/api/player/${playerId}/profile`);
  if (!response.ok) {
    throw new Error(`Failed to fetch player profile: ${playerId}`);
  }
  return response.json();
}
