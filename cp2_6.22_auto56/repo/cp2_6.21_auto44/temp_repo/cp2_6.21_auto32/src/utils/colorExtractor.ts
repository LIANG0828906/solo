interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function distance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function kmeansPlusPlusInit(pixels: RGB[], k: number): RGB[] {
  const centers: RGB[] = [];
  if (pixels.length === 0) return centers;

  centers.push({ ...pixels[Math.floor(Math.random() * pixels.length)] });

  while (centers.length < k) {
    const distances = pixels.map((p) => {
      let minDist = Infinity;
      for (const c of centers) {
        const d = distance(p, c);
        if (d < minDist) minDist = d;
      }
      return minDist;
    });

    const total = distances.reduce((sum, d) => sum + d, 0);
    if (total === 0) {
      centers.push({ ...pixels[Math.floor(Math.random() * pixels.length)] });
      continue;
    }

    let r = Math.random() * total;
    for (let i = 0; i < pixels.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centers.push({ ...pixels[i] });
        break;
      }
    }
  }

  return centers;
}

export function extractColors(imageData: ImageData, k: number = 5): string[] {
  const { data, width, height } = imageData;
  const pixels: RGB[] = [];

  const sampleStep = Math.max(1, Math.floor((width * height) / 10000));

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const a = data[i + 3];
    if (a < 128) continue;
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }

  if (pixels.length === 0) {
    return ['#E57373', '#64B5F6', '#81C784', '#FFD54F', '#BA68C8'];
  }

  const actualK = Math.min(k, pixels.length);
  let centers = kmeansPlusPlusInit(pixels, actualK);

  const maxIterations = 20;
  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters: RGB[][] = Array.from({ length: actualK }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let j = 0; j < centers.length; j++) {
        const d = distance(pixel, centers[j]);
        if (d < minDist) {
          minDist = d;
          minIdx = j;
        }
      }
      clusters[minIdx].push(pixel);
    }

    const newCenters: RGB[] = [];
    let converged = true;

    for (let j = 0; j < actualK; j++) {
      if (clusters[j].length === 0) {
        newCenters.push(centers[j] || { r: 128, g: 128, b: 128 });
        continue;
      }

      let sumR = 0, sumG = 0, sumB = 0;
      for (const p of clusters[j]) {
        sumR += p.r;
        sumG += p.g;
        sumB += p.b;
      }
      const newCenter: RGB = {
        r: sumR / clusters[j].length,
        g: sumG / clusters[j].length,
        b: sumB / clusters[j].length,
      };
      newCenters.push(newCenter);

      if (centers[j] && distance(newCenter, centers[j]) > 1) {
        converged = false;
      }
    }

    centers = newCenters;
    if (converged) break;
  }

  const sortedCenters = centers
    .map((c, idx) => ({ c, idx, count: 0 }))
    .sort((a, b) => {
      const brightA = a.c.r * 0.299 + a.c.g * 0.587 + a.c.b * 0.114;
      const brightB = b.c.r * 0.299 + b.c.g * 0.587 + b.c.b * 0.114;
      return brightB - brightA;
    })
    .map((item) => item.c);

  return sortedCenters.map((c) => rgbToHex(c.r, c.g, c.b));
}

export { rgbToHex, hexToRgb };
