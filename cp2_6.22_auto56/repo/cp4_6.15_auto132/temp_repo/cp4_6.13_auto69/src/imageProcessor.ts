import type { RGB, ImageData, ClusterGroup, Position } from './types';

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToLab(rgb: RGB): { L: number; a: number; b: number } {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

export function ciede2000(color1: RGB, color2: RGB): number {
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);

  const L1 = lab1.L;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.L;
  const a2 = lab2.a;
  const b2 = lab2.b;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cb = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const Cbp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p);
  if (h1p < 0) h1p += 2 * Math.PI;
  let h2p = Math.atan2(b2, a2p);
  if (h2p < 0) h2p += 2 * Math.PI;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = h2p - h1p;
  if (Math.abs(dhp) > Math.PI) {
    if (h2p <= h1p) dhp += 2 * Math.PI;
    else dhp -= 2 * Math.PI;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2);

  const Lbp = (L1 + L2) / 2;
  let Hbp = (h1p + h2p) / 2;
  if (Math.abs(h1p - h2p) > Math.PI) {
    if (h1p + h2p < 2 * Math.PI) Hbp += Math.PI;
    else Hbp -= Math.PI;
  }

  const T =
    1 -
    0.17 * Math.cos(Hbp - Math.PI / 6) +
    0.24 * Math.cos(2 * Hbp) +
    0.32 * Math.cos(3 * Hbp + Math.PI / 30) -
    0.2 * Math.cos(4 * Hbp - (63 * Math.PI) / 180);

  const dTheta = (30 * Math.PI) / 180 * Math.exp(-Math.pow((Hbp - (275 * Math.PI) / 180) / ((25 * Math.PI) / 180), 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta) * Rc;

  const de = Math.sqrt(
    Math.pow(dLp / (kL * Sl), 2) +
      Math.pow(dCp / (kC * Sc), 2) +
      Math.pow(dHp / (kH * Sh), 2) +
      Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh))
  );

  return de;
}

export function averageColor(colors: RGB[]): RGB {
  if (colors.length === 0) return { r: 128, g: 128, b: 128 };
  let r = 0,
    g = 0,
    b = 0;
  for (const c of colors) {
    r += c.r;
    g += c.g;
    b += c.b;
  }
  return {
    r: Math.round(r / colors.length),
    g: Math.round(g / colors.length),
    b: Math.round(b / colors.length),
  };
}

export function clusterImages(images: ImageData[], threshold: number): ClusterGroup[] {
  if (images.length === 0) return [];

  const clusters: ImageData[][] = [];
  const clusterColors: RGB[] = [];

  for (const img of images) {
    let bestClusterIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < clusters.length; i++) {
      const dist = ciede2000(img.averageColor, clusterColors[i]);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestClusterIndex = i;
      }
    }

    if (bestClusterIndex !== -1 && bestDistance < threshold) {
      clusters[bestClusterIndex].push(img);
      const allColors = clusters[bestClusterIndex].map((im) => im.averageColor);
      clusterColors[bestClusterIndex] = averageColor(allColors);
    } else {
      clusters.push([img]);
      clusterColors.push(img.averageColor);
    }
  }

  const positions = generateClusterPositions(clusters.length);

  return clusters.map((clusterImgs, index) => ({
    groupId: `cluster-${index}`,
    color: clusterColors[index],
    colorHex: rgbToHex(clusterColors[index]),
    images: clusterImgs,
    position: positions[index],
    radius: 0.6 + Math.random() * 0.6,
  }));
}

function generateClusterPositions(count: number): Position[] {
  const positions: Position[] = [];
  const minDistance = 2;
  const maxAttempts = 100;

  for (let i = 0; i < count; i++) {
    let pos: Position | null = null;
    let attempts = 0;

    while (!pos && attempts < maxAttempts) {
      const candidate = randomHemispherePoint(10);
      let valid = true;

      for (const existing of positions) {
        const dist = Math.sqrt(
          Math.pow(candidate.x - existing.x, 2) +
            Math.pow(candidate.y - existing.y, 2) +
            Math.pow(candidate.z - existing.z, 2)
        );
        if (dist < minDistance) {
          valid = false;
          break;
        }
      }

      if (valid) {
        pos = candidate;
      }
      attempts++;
    }

    positions.push(pos || randomHemispherePoint(10));
  }

  return positions;
}

function randomHemispherePoint(radius: number): Position {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());

  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: Math.abs(r * Math.cos(phi)) * 0.8,
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

export async function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(URL.createObjectURL(file));
        return;
      }

      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
