import axios from 'axios';
import type { Keyframe, ShareResponse } from './types';

const API_BASE = '/api';

export async function createShare(hash: string, keyframes: Keyframe[]): Promise<ShareResponse> {
  const response = await axios.post<ShareResponse>(`${API_BASE}/share`, {
    hash,
    keyframes,
    createdAt: Date.now(),
  });
  return response.data;
}

export async function getShare(hash: string): Promise<ShareResponse> {
  const response = await axios.get<ShareResponse>(`${API_BASE}/share/${hash}`);
  return response.data;
}

export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 12);
}
