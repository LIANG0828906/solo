import { GalleryItem } from '@/types';

const GALLERY_STORAGE_KEY = 'nft-art-gallery';

export function saveGallery(gallery: GalleryItem[]): void {
  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
  } catch (e) {
    console.error('Failed to save gallery to localStorage:', e);
  }
}

export function loadGallery(): GalleryItem[] {
  try {
    const data = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load gallery from localStorage:', e);
  }
  return [];
}

export function generateArtId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ART-${part1}-${part2}`;
}

export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Failed to copy to clipboard:', e);
    return false;
  }
}

export function generateThumbnail(
  canvas: HTMLCanvasElement,
  maxWidth: number = 100,
  maxHeight: number = 100
): string {
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = maxWidth;
  thumbnailCanvas.height = maxHeight;
  const ctx = thumbnailCanvas.getContext('2d');
  if (!ctx) return '';

  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const x = (maxWidth - canvas.width * scale) / 2;
  const y = (maxHeight - canvas.height * scale) / 2;

  ctx.drawImage(canvas, x, y, canvas.width * scale, canvas.height * scale);
  return thumbnailCanvas.toDataURL('image/png');
}
