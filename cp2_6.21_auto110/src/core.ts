export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export interface Lens {
  x: number;
  y: number;
  radius: number;
  strength: number;
  ellipticity: number;
  rotation: number;
}

export interface VirtualImage {
  x: number;
  y: number;
  brightness: number;
  sourceIndex: number;
}

const CANVAS_SIZE = 800;
const CANVAS_CENTER = CANVAS_SIZE / 2;

export function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      size: 1 + Math.random() * 2,
      brightness: 0.6 + Math.random() * 0.4
    });
  }
  return stars;
}

function computeDeflection(
  starX: number,
  starY: number,
  lens: Lens
): { dx: number; dy: number; distance: number } {
  let dx = starX - lens.x;
  let dy = starY - lens.y;

  const cosR = Math.cos(lens.rotation);
  const sinR = Math.sin(lens.rotation);
  const rx = dx * cosR + dy * sinR;
  const ry = -dx * sinR + dy * cosR;

  const ex = 1 - lens.ellipticity;
  const ey = 1 + lens.ellipticity;
  const transformedDist = Math.sqrt((rx * rx) / (ex * ex) + (ry * ry) / (ey * ey));

  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 1) {
    return { dx: 0, dy: 0, distance };
  }

  const einsteinRadius = lens.radius * Math.sqrt(lens.strength / 5);
  const deflectionMagnitude = (einsteinRadius * einsteinRadius) / Math.max(transformedDist, 5);

  const nx = dx / distance;
  const ny = dy / distance;

  return {
    dx: nx * deflectionMagnitude,
    dy: ny * deflectionMagnitude,
    distance
  };
}

export function generateVirtualImages(stars: Star[], lens: Lens): VirtualImage[] {
  const images: VirtualImage[] = [];
  const einsteinRadius = lens.radius * Math.sqrt(lens.strength / 5);

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const dx = star.x - lens.x;
    const dy = star.y - lens.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) continue;

    const { dx: deflDx, dy: deflDy } = computeDeflection(star.x, star.y, lens);

    const primaryImg: VirtualImage = {
      x: star.x + deflDx,
      y: star.y + deflDy,
      brightness: star.brightness * Math.min(1, einsteinRadius / Math.max(distance, einsteinRadius / 2)),
      sourceIndex: i
    };
    images.push(primaryImg);

    if (distance < einsteinRadius * 2.5 && lens.strength >= 3) {
      const angle = Math.atan2(dy, dx);
      const mirrorAngle = angle + Math.PI;
      const mirrorDist = (einsteinRadius * einsteinRadius) / Math.max(distance, 1);

      const secondaryImg: VirtualImage = {
        x: lens.x + Math.cos(mirrorAngle) * mirrorDist,
        y: lens.y + Math.sin(mirrorAngle) * mirrorDist,
        brightness: star.brightness * 0.5 * (1 - distance / (einsteinRadius * 2.5)),
        sourceIndex: i
      };
      images.push(secondaryImg);
    }

    if (distance < einsteinRadius * 1.2 && lens.strength >= 6) {
      const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
      for (let k = -1; k <= 1; k += 2) {
        const extraDist = einsteinRadius * 0.8;
        const extraImg: VirtualImage = {
          x: lens.x + Math.cos(perpAngle + k * 0.5) * extraDist,
          y: lens.y + Math.sin(perpAngle + k * 0.5) * extraDist,
          brightness: star.brightness * 0.25 * (1 - distance / (einsteinRadius * 1.2)),
          sourceIndex: i
        };
        images.push(extraImg);
      }
    }
  }

  return images.filter(
    (img) =>
      img.x >= -50 &&
      img.x <= CANVAS_SIZE + 50 &&
      img.y >= -50 &&
      img.y <= CANVAS_SIZE + 50 &&
      img.brightness > 0.05
  );
}

export function getEquipotentialRadii(strength: number): number[] {
  const ringCount = Math.floor(2 + strength * 0.4);
  const baseRadius = 20 + strength * 3;
  const radii: number[] = [];
  for (let i = 0; i < ringCount; i++) {
    radii.push(baseRadius * (1 + i * 0.5));
  }
  return radii;
}

export function interpolateColor(t: number): string {
  const r1 = 0, g1 = 255, b1 = 255;
  const r2 = 255, g2 = 0, b2 = 255;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function checkLevelMatch(
  currentLens: Lens,
  targetLens: Partial<Lens>,
  tolerance: number = 0.05
): boolean {
  const normalize = (val: number, max: number) => val / max;

  if (targetLens.x !== undefined && targetLens.y !== undefined) {
    const dx = Math.abs(currentLens.x - targetLens.x) / CANVAS_SIZE;
    const dy = Math.abs(currentLens.y - targetLens.y) / CANVAS_SIZE;
    if (dx > tolerance || dy > tolerance) return false;
  }

  if (targetLens.strength !== undefined) {
    const ds = Math.abs(normalize(currentLens.strength, 10) - normalize(targetLens.strength, 10));
    if (ds > tolerance) return false;
  }

  if (targetLens.ellipticity !== undefined) {
    const de = Math.abs(currentLens.ellipticity - targetLens.ellipticity);
    if (de > tolerance) return false;
  }

  return true;
}

export { CANVAS_SIZE, CANVAS_CENTER };
