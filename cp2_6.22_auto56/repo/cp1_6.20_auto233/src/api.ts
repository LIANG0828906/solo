const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
}

export interface FrameData {
  imageData: string;
}

export interface SavePayload {
  title: string;
  author: string;
  price: number;
  frames: FrameData[];
  frameDuration: number;
}

export interface Listing {
  id: string;
  title: string;
  author: string;
  price: number;
  frames: FrameData[];
  frameDuration: number;
  qrCode: string;
  createdAt: string;
  purchased: boolean;
}

export async function saveCanvas(payload: SavePayload): Promise<Listing> {
  return request<Listing>('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getListings(): Promise<Listing[]> {
  return request<Listing[]>('/listings');
}

export async function purchaseSticker(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}
