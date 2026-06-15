import type { Artwork, Booth, PlacedArtwork } from './types';

function getRotatedDimensions(width: number, height: number, rotation: 0 | 45 | 90): { width: number; height: number } {
  if (rotation === 45) {
    const diagonal = Math.sqrt(width * width + height * height);
    return { width: diagonal, height: diagonal };
  }
  if (rotation === 90) {
    return { width: height, height: width };
  }
  return { width, height };
}

function rectanglesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

export function addArtwork(
  artwork: Artwork,
  booth: Booth,
  placed: PlacedArtwork[]
): { x: number; y: number } | null {
  const rotated = getRotatedDimensions(artwork.width, artwork.height, artwork.rotation);
  const x = booth.x + (booth.width - rotated.width) / 2;
  const y = booth.y + (booth.height - rotated.height) / 2;

  const hasConflict = checkOverlap(
    { x, y, width: rotated.width, height: rotated.height },
    placed
  );

  if (hasConflict) {
    return null;
  }

  return { x, y };
}

export function removeArtwork(
  artworkId: string,
  placed: PlacedArtwork[]
): PlacedArtwork[] {
  return placed.filter(a => a.id !== artworkId);
}

export function checkOverlap(
  newPos: { x: number; y: number; width: number; height: number },
  existing: PlacedArtwork[],
  excludeId?: string
): boolean {
  for (const artwork of existing) {
    if (excludeId && artwork.id === excludeId) continue;
    const rotated = getRotatedDimensions(artwork.width, artwork.height, artwork.rotation);
    if (rectanglesOverlap(
      newPos.x, newPos.y, newPos.width, newPos.height,
      artwork.x, artwork.y, rotated.width, rotated.height
    )) {
      return true;
    }
  }
  return false;
}

export function getPlacementSuggestions(
  artworks: Artwork[],
  booths: Booth[]
): PlacedArtwork[] {
  const placed: PlacedArtwork[] = [];
  const availableBooths = [...booths];
  
  for (const artwork of artworks) {
    let placedSuccess = false;
    
    for (let i = 0; i < availableBooths.length; i++) {
      const booth = availableBooths[i];
      const rotated = getRotatedDimensions(artwork.width, artwork.height, artwork.rotation);
      const x = booth.x + (booth.width - rotated.width) / 2;
      const y = booth.y + (booth.height - rotated.height) / 2;
      
      const hasConflict = checkOverlap(
        { x, y, width: rotated.width, height: rotated.height },
        placed
      );
      
      if (!hasConflict) {
        placed.push({
          ...artwork,
          boothId: booth.id,
          x,
          y,
        });
        availableBooths.splice(i, 1);
        placedSuccess = true;
        break;
      }
    }
    
    if (!placedSuccess) {
      console.warn(`无法放置展品: ${artwork.title}`);
    }
  }
  
  return placed;
}

export function createBoothGrid(rows: number, cols: number, boothWidth: number, boothHeight: number, gap: number): Booth[] {
  const booths: Booth[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      booths.push({
        id: `booth-${row}-${col}`,
        x: col * (boothWidth + gap),
        y: row * (boothHeight + gap),
        width: boothWidth,
        height: boothHeight,
        row,
        col,
      });
    }
  }
  return booths;
}

export function getBoothAtPosition(
  x: number,
  y: number,
  booths: Booth[],
  scale: number,
  offset: { x: number; y: number }
): Booth | null {
  const transformedX = (x - offset.x) / scale;
  const transformedY = (y - offset.y) / scale;
  
  for (const booth of booths) {
    if (
      transformedX >= booth.x &&
      transformedX < booth.x + booth.width &&
      transformedY >= booth.y &&
      transformedY < booth.y + booth.height
    ) {
      return booth;
    }
  }
  return null;
}
