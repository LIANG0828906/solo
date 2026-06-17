import type { Marker } from '../stores/useMapStore';

export interface ShortLinkRequest {
  markers: Marker[];
  center: [number, number];
  zoom: number;
}

export interface ShortLinkResponse {
  shortUrl: string;
  expiresAt: number;
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateShortLink(data: ShortLinkRequest): Promise<ShortLinkResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const shortCode = generateShortCode();
      const encodedData = btoa(encodeURIComponent(JSON.stringify(data)));
      resolve({
        shortUrl: `https://trip.map/s/${shortCode}`,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    }, 800);
  });
}

export function parseShortLinkData(encoded: string): ShortLinkRequest | null {
  try {
    const decoded = decodeURIComponent(atob(encoded));
    return JSON.parse(decoded) as ShortLinkRequest;
  } catch {
    return null;
  }
}
