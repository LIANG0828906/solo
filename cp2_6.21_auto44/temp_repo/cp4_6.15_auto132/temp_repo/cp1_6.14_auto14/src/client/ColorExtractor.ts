interface ColorCount {
  r: number;
  g: number;
  b: number;
  count: number;
}

interface ColorBox {
  rMin: number; rMax: number;
  gMin: number; gMax: number;
  bMin: number; bMax: number;
  pixels: ColorCount[];
}

function medianCut(pixels: ColorCount[], colorCount: number): ColorCount[] {
  if (colorCount <= 0 || pixels.length === 0) return [];
  if (colorCount === 1 || pixels.length === 1) return pixels;

  const boxes: ColorBox[] = [];
  let rMin = Infinity, rMax = -Infinity;
  let gMin = Infinity, gMax = -Infinity;
  let bMin = Infinity, bMax = -Infinity;

  for (const pixel of pixels) {
    rMin = Math.min(rMin, pixel.r);
    rMax = Math.max(rMax, pixel.r);
    gMin = Math.min(gMin, pixel.g);
    gMax = Math.max(gMax, pixel.g);
    bMin = Math.min(bMin, pixel.b);
    bMax = Math.max(bMax, pixel.b);
  }

  boxes.push({ rMin, rMax, gMin, gMax, bMin, bMax, pixels });

  while (boxes.length < colorCount) {
    let maxRange = -1;
    let maxBoxIndex = -1;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const rRange = box.rMax - box.rMin;
      const gRange = box.gMax - box.gMin;
      const bRange = box.bMax - box.bMin;
      const range = Math.max(rRange, gRange, bRange);
      
      if (range > maxRange) {
        maxRange = range;
        maxBoxIndex = i;
      }
    }

    if (maxBoxIndex === -1 || maxRange === 0) break;

    const box = boxes[maxBoxIndex];
    const rRange = box.rMax - box.rMin;
    const gRange = box.gMax - box.gMin;
    const bRange = box.bMax - box.bMin;

    let sortChannel: 'r' | 'g' | 'b';
    if (rRange >= gRange && rRange >= bRange) {
      sortChannel = 'r';
    } else if (gRange >= bRange) {
      sortChannel = 'g';
    } else {
      sortChannel = 'b';
    }

    const sorted = [...box.pixels].sort((a, b) => a[sortChannel] - b[sortChannel]);
    const mid = Math.floor(sorted.length / 2);
    const leftPixels = sorted.slice(0, mid);
    const rightPixels = sorted.slice(mid);

    if (leftPixels.length === 0 || rightPixels.length === 0) break;

    let lrMin = Infinity, lrMax = -Infinity;
    let lgMin = Infinity, lgMax = -Infinity;
    let lbMin = Infinity, lbMax = -Infinity;

    for (const p of leftPixels) {
      lrMin = Math.min(lrMin, p.r);
      lrMax = Math.max(lrMax, p.r);
      lgMin = Math.min(lgMin, p.g);
      lgMax = Math.max(lgMax, p.g);
      lbMin = Math.min(lbMin, p.b);
      lbMax = Math.max(lbMax, p.b);
    }

    let rrMin = Infinity, rrMax = -Infinity;
    let rgMin = Infinity, rgMax = -Infinity;
    let rbMin = Infinity, rbMax = -Infinity;

    for (const p of rightPixels) {
      rrMin = Math.min(rrMin, p.r);
      rrMax = Math.max(rrMax, p.r);
      rgMin = Math.min(rgMin, p.g);
      rgMax = Math.max(rgMax, p.g);
      rbMin = Math.min(rbMin, p.b);
      rbMax = Math.max(rbMax, p.b);
    }

    boxes.splice(maxBoxIndex, 1, {
      rMin: lrMin, rMax: lrMax,
      gMin: lgMin, gMax: lgMax,
      bMin: lbMin, bMax: lbMax,
      pixels: leftPixels
    }, {
      rMin: rrMin, rMax: rrMax,
      gMin: rgMin, gMax: rgMax,
      bMin: rbMin, bMax: rbMax,
      pixels: rightPixels
    });
  }

  return boxes.map(box => {
    let rSum = 0, gSum = 0, bSum = 0, totalCount = 0;
    for (const p of box.pixels) {
      rSum += p.r * p.count;
      gSum += p.g * p.count;
      bSum += p.b * p.count;
      totalCount += p.count;
    }
    return {
      r: Math.round(rSum / totalCount),
      g: Math.round(gSum / totalCount),
      b: Math.round(bSum / totalCount),
      count: totalCount
    };
  }).sort((a, b) => b.count - a.count);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

self.onmessage = function(e: MessageEvent) {
  const { imageData, colorCount = 6 } = e.data;
  const data = imageData.data;
  const colorMap = new Map<string, ColorCount>();

  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 8) * 8;
    const g = Math.round(data[i + 1] / 8) * 8;
    const b = Math.round(data[i + 2] / 8) * 8;
    const key = `${r},${g},${b}`;
    
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r, g, b, count: 1 });
    }
  }

  const pixels = Array.from(colorMap.values());
  const dominantColors = medianCut(pixels, colorCount);

  const result = dominantColors.map(c => ({
    hex: rgbToHex(c.r, c.g, c.b),
    rgb: { r: c.r, g: c.g, b: c.b },
    count: c.count
  }));

  self.postMessage(result);
};

export {};
