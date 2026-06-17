export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
}

export interface Favorite {
  id: string;
  trackId: string;
  createdAt: number;
}

const API_BASE = '/music';

export async function getTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/tracks`);
  if (!res.ok) throw new Error('Failed to fetch tracks');
  return res.json();
