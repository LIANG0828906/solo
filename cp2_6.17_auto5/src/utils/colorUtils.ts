export interface ExtractedColor {
  hex: string;
  percentage: number;
  role: 'primary' | 'secondary' | 'accent';
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastTextColor(hex: string): string {
  const luminance = getLuminance(hex);
  return luminance > 0.5 ? '#2D2D2D' : '#FFFFFF';
}

export function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function normalizeHex(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return '#' + h.toUpperCase();
}

function getDistance(c1: number[], c2: number[]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

function kMeans(pixels: number[][], k: number): { centroid: number[]; count: number }[] {
  if (pixels.length === 0) return [];
  if (pixels.length <= k) {
    return pixels.map(p => ({ centroid: p, count: 1 }));
  }

  const centroids: number[][] = [];
  const shuffled = [...pixels].sort(() => Math.random() - 0.5);
  for (let i = 0; i < k && i < shuffled.length; i++) {
    centroids.push([...shuffled[i]]);
  }

  for (let iter = 0; iter < 20; iter++) {
    const clusters: number[][][] = centroids.map(() => []);
    
    for (const pixel of pixels) {
      let minDist = Infinity;
      let closest = 0;
      for (let i = 0; i < centroids.length; i++) {
        const dist = getDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      clusters[closest].push(pixel);
    }

    let changed = false;
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length === 0) continue;
      const newCentroid = [0, 0, 0];
      for (const p of clusters[i]) {
        newCentroid[0] += p[0];
        newCentroid[1] += p[1];
        newCentroid[2] += p[2];
      }
      newCentroid[0] = Math.round(newCentroid[0] / clusters[i].length);
      newCentroid[1] = Math.round(newCentroid[1] / clusters[i].length);
      newCentroid[2] = Math.round(newCentroid[2] / clusters[i].length);
      
      if (getDistance(newCentroid, centroids[i]) > 1) {
        changed = true;
        centroids[i] = newCentroid;
      }
    }

    if (!changed) break;
  }

  const clusters: number[][][] = centroids.map(() => []);
  for (const pixel of pixels) {
    let minDist = Infinity;
    let closest = 0;
    for (let i = 0; i < centroids.length; i++) {
      const dist = getDistance(pixel, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    clusters[closest].push(pixel);
  }

  return centroids.map((c, i) => ({
    centroid: c,
    count: clusters[i].length
  })).filter(r => r.count > 0);
}

export async function extractColorsFromImage(
  imageFile: File,
  maxColors: number = 6
): Promise<ExtractedColor[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    img.onload = () => {
      const maxSize = 300;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height / width) * maxSize;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: number[][] = [];
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        
        if (a > 128) {
          pixels.push([r, g, b]);
        }
      }

      const results = kMeans(pixels, Math.min(maxColors, pixels.length));
      const totalPixels = pixels.length;

      const sorted = results
        .sort((a, b) => b.count - a.count)
        .slice(0, maxColors);

      const extracted: ExtractedColor[] = sorted.map((result, index) => {
        const [r, g, b] = result.centroid;
        let role: 'primary' | 'secondary' | 'accent' = 'secondary';
        if (index === 0) role = 'primary';
        else if (index === sorted.length - 1) role = 'accent';

        return {
          hex: rgbToHex(r, g, b),
          percentage: Math.round((result.count / totalPixels) * 100),
          role
        };
      });

      resolve(extracted);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}
