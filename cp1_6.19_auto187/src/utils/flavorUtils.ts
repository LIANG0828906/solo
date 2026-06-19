import { FLAVOR_TAGS } from '../module1/types';

export function calculateFlavorCenter(tagIds: string[]): { x: number; y: number } {
  if (tagIds.length === 0) {
    return { x: 0, y: 0 };
  }

  const tags = tagIds
    .map((id) => FLAVOR_TAGS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  if (tags.length === 0) {
    return { x: 0, y: 0 };
  }

  const sumX = tags.reduce((acc, t) => acc + t.x, 0);
  const sumY = tags.reduce((acc, t) => acc + t.y, 0);

  return {
    x: sumX / tags.length,
    y: sumY / tags.length,
  };
}

export function flavorToPixel(
  flavorX: number,
  flavorY: number,
  mapWidth: number,
  mapHeight: number,
  padding: number = 80
): { x: number; y: number } {
  const usableWidth = mapWidth - padding * 2;
  const usableHeight = mapHeight - padding * 2;

  const x = padding + ((flavorX + 1) / 2) * usableWidth;
  const y = padding + ((1 - flavorY) / 2) * usableHeight;

  return { x, y };
}

export function getGradientFromTags(tagIds: string[]): string {
  if (tagIds.length === 0) {
    return 'linear-gradient(135deg, #F5E6C8 0%, #E8D5B0 100%)';
  }

  const tags = tagIds
    .map((id) => FLAVOR_TAGS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  if (tags.length === 0) {
    return 'linear-gradient(135deg, #F5E6C8 0%, #E8D5B0 100%)';
  }

  return tags[0].gradient;
}

export function getPrimaryTagColor(tagIds: string[]): string {
  if (tagIds.length === 0) {
    return '#D2B48C';
  }

  const tag = FLAVOR_TAGS.find((t) => t.id === tagIds[0]);
  return tag?.color ?? '#D2B48C';
}
