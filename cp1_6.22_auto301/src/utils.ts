import { v4 as uuidv4 } from 'uuid';
import type { Postcard } from './types';

export const PRESET_COLORS = [
  '#E8B4B8',
  '#B8D4E8',
  '#C8E8B8',
  '#E8D4B8',
  '#D4B8E8',
  '#E8E0B8',
  '#B8E0E8',
  '#E8B8D0',
];

export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 320;
export const MIN_SPACING = 30;
export const CANVAS_WIDTH = 3000;
export const CANVAS_HEIGHT = 2000;

const PRESET_POSTCARDS_DATA = [
  { title: '京都的黄昏', location: '日本京都', date: '2023-11-15' },
  { title: '巴黎铁塔下的咖啡', location: '法国巴黎', date: '2023-07-22' },
  { title: '冰岛极光之夜', location: '冰岛雷克雅未克', date: '2024-02-08' },
  { title: '巴厘岛的海滩', location: '印度尼西亚巴厘岛', date: '2024-05-18' },
  { title: '丽江古城的清晨', location: '中国云南丽江', date: '2024-09-03' },
];

type PositionData = {
  x: number;
  y: number;
  rotation: number;
  color: string;
};

export function generateNonOverlappingPositions(
  count: number,
  canvasWidth: number,
  canvasHeight: number,
): PositionData[] {
  const positions: PositionData[] = [];
  const maxAttempts = 100;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition: PositionData | null = null;

    while (attempts < maxAttempts && !validPosition) {
      const x = Math.random() * (canvasWidth - CARD_WIDTH - 100) + 50;
      const y = Math.random() * (canvasHeight - CARD_HEIGHT - 100) + 50;
      const rotation = (Math.random() - 0.5) * 30;
      const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

      const overlaps = positions.some((pos) => {
        const dx = Math.abs(x - pos.x);
        const dy = Math.abs(y - pos.y);
        return dx < CARD_WIDTH + MIN_SPACING && dy < CARD_HEIGHT + MIN_SPACING;
      });

      if (!overlaps) {
        validPosition = { x, y, rotation, color };
      }
      attempts++;
    }

    if (validPosition) {
      positions.push(validPosition);
    }
  }

  return positions;
}

export function generateInitialPostcards(): Postcard[] {
  const positions = generateNonOverlappingPositions(
    PRESET_POSTCARDS_DATA.length,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  );

  return PRESET_POSTCARDS_DATA.map((data, index) => {
    const pos = positions[index] || {
      x: 100 + index * 300,
      y: 100,
      rotation: 0,
      color: PRESET_COLORS[index % PRESET_COLORS.length],
    };

    return {
      id: uuidv4(),
      title: data.title,
      location: data.location,
      date: data.date,
      note: '',
      imageUrl: pos.color,
      x: pos.x,
      y: pos.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      rotation: pos.rotation,
    };
  });
}

export function isInViewport(
  cardX: number,
  cardY: number,
  cardWidth: number,
  cardHeight: number,
  offsetX: number,
  offsetY: number,
  zoomLevel: number,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  const left = (cardX + offsetX) * zoomLevel;
  const right = (cardX + cardWidth + offsetX) * zoomLevel;
  const top = (cardY + offsetY) * zoomLevel;
  const bottom = (cardY + cardHeight + offsetY) * zoomLevel;

  return right >= 0 && left <= viewportWidth && bottom >= 0 && top <= viewportHeight;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
