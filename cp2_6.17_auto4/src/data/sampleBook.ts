import { v4 as uuidv4 } from 'uuid';
import type { Book, ComicPage, Hotspot } from '@/types';

function createHotspot(
  x: number,
  y: number,
  width: number,
  height: number,
  type: 'blink' | 'glow'
): Hotspot {
  return { id: uuidv4(), x, y, width, height, type };
}

function createPage(idx: number): ComicPage {
  const hotspots: Hotspot[] = [];
  const patterns = [
    [
      createHotspot(25, 30, 10, 8, 'blink'),
      createHotspot(55, 30, 10, 8, 'blink'),
      createHotspot(40, 65, 20, 12, 'glow'),
    ],
    [
      createHotspot(30, 40, 12, 10, 'glow'),
      createHotspot(60, 50, 8, 12, 'blink'),
    ],
    [
      createHotspot(20, 25, 10, 10, 'blink'),
      createHotspot(45, 45, 15, 15, 'glow'),
      createHotspot(70, 30, 10, 10, 'blink'),
    ],
    [
      createHotspot(35, 35, 12, 12, 'glow'),
      createHotspot(65, 55, 10, 8, 'blink'),
    ],
    [
      createHotspot(25, 40, 8, 10, 'blink'),
      createHotspot(50, 30, 14, 14, 'glow'),
      createHotspot(72, 45, 8, 10, 'blink'),
    ],
    [
      createHotspot(30, 30, 12, 12, 'glow'),
      createHotspot(60, 35, 10, 10, 'blink'),
    ],
  ];
  const pattern = patterns[idx % patterns.length];
  hotspots.push(...pattern);

  return {
    id: uuidv4(),
    imageUrl: `https://picsum.photos/seed/pageflick-${idx + 1}/800/600`,
    hotspots,
  };
}

export function createSampleBook(): Book {
  const pages: ComicPage[] = [];
  const totalPages = 6;
  for (let i = 0; i < totalPages; i++) {
    pages.push(createPage(i));
  }

  return {
    id: 'sample-comic-001',
    title: '示例连环画',
    totalPages,
    pages,
  };
}
