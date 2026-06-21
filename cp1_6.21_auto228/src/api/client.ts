import axios from 'axios';
import { GameState, LeaderboardEntry } from '../types/game';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export async function saveGame(gameState: GameState): Promise<{ success: boolean; gameId: string }> {
  try {
    const response = await api.post('/games', gameState);
    return response.data;
  } catch (error) {
    console.error('Failed to save game:', error);
    throw error;
  }
}

export async function loadGame(gameId: string): Promise<{ success: boolean; game: GameState }> {
  try {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to load game:', error);
    throw error;
  }
}

export async function updateGame(gameId: string, updates: Partial<GameState>): Promise<{ success: boolean; game: GameState }> {
  try {
    const response = await api.put(`/games/${gameId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update game:', error);
    throw error;
  }
}

export async function getLeaderboard(): Promise<{ success: boolean; entries: LeaderboardEntry[] }> {
  try {
    const response = await api.get('/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    throw error;
  }
}

export async function addLeaderboardEntry(entry: LeaderboardEntry): Promise<{ success: boolean; entry: LeaderboardEntry }> {
  try {
    const response = await api.post('/leaderboard', entry);
    return response.data;
  } catch (error) {
    console.error('Failed to add leaderboard entry:', error);
    throw error;
  }
}

export async function deleteLeaderboardEntry(entryId: string): Promise<{ success: boolean }> {
  try {
    const response = await api.delete(`/leaderboard/${entryId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete leaderboard entry:', error);
    throw error;
  }
}
