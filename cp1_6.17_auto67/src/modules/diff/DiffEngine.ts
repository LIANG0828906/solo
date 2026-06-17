import type { DiffResult, DiffRegion } from '@/types';

const DIFF_THRESHOLD = 10;

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixelCount: number;
  totalColorDiff: number;
}

function floodFillRegions(diffMask: Uint8Array, width: number, height: number): BoundingBox[] {
  const visited = new Uint8Array(width * height);
  const regions: BoundingBox[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (diffMask[idx] && !visited[idx]) {
        let minX = x, minY = y, maxX = x, maxY = y;
        let pixelCount = 0;
        let totalColorDiff = 0;
        const stack = [idx];
        visited[idx] = 1;

        while (stack.length > 0) {
          const ci = stack.pop()!;
          const cx = ci % width;
          const cy = (ci - cx) / width;

          minX = Math.min(minX, cx);
          minY = Math.min(minY, cy);
          maxX = Math.max(maxX, cx);
          maxY = Math.max(maxY, cy);
          pixelCount++;
          totalColorDiff += diffMask[ci];

          const neighbors = [
            ci - 1,
            ci + 1,
            ci - width,
            ci + width,
          ];
          for (const ni of neighbors) {
            const nx = ni % width;
            const ny = (ni - nx) / width;
            if (ni >= 0 && ni < width * height && !visited[ni] && diffMask[ni]) {
              if (Math.abs(nx - cx) <= 1 && Math.abs(ny - cy) <= 1) {
                visited[ni] = 1;
                stack.push(ni);
              }
            }
          }
        }

        if (pixelCount >= 4) {
          regions.push({ minX, minY, maxX, maxY, pixelCount, totalColorDiff });
        }
      }
    }
  }

  return regions;
}

export function diffCanvases(
  canvasA: HTMLCanvasElement,
  canvasB: HTMLCanvasElement
): DiffResult {
  const width = Math.max(canvasA.width, canvasB.width);
  const height = Math.max(canvasA.height, canvasB.height);

  const tmpA = document.createElement('canvas');
  tmpA.width = width;
  tmpA.height = height;
  const ctxA = tmpA.getContext('2d')!;
  ctxA.fillStyle = '#FFFFFF';
  ctxA.fillRect(0, 0, width, height);
  ctxA.drawImage(canvasA, 0, 0);

  const tmpB = document.createElement('canvas');
  tmpB.width = width;
  tmpB.height = height;
  const ctxB = tmpB.getContext('2d')!;
  ctxB.fillStyle = '#FFFFFF';
  ctxB.fillRect(0, 0, width, height);
  ctxB.drawImage(canvasB, 0, 0);

  const dataA = ctxA.getImageData(0, 0, width, height).data;
  const dataB = ctxB.getImageData(0, 0, width, height).data;

  const totalPixels = width * height;
  let totalDiffPixels = 0;
  const diffMask = new Uint8Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const dr = Math.abs(dataA[offset] - dataB[offset]);
    const dg = Math.abs(dataA[offset + 1] - dataB[offset + 1]);
    const db = Math.abs(dataA[offset + 2] - dataB[offset + 2]);
    const da = Math.abs(dataA[offset + 3] - dataB[offset + 3]);
    const colorDiff = Math.max(dr, dg, db, da);

    if (colorDiff > DIFF_THRESHOLD) {
      totalDiffPixels++;
      diffMask[i] = colorDiff;
    }
  }

  const boxes = floodFillRegions(diffMask, width, height);

  const diffRegions: DiffRegion[] = boxes.map((box) => ({
    x: box.minX,
    y: box.minY,
    width: box.maxX - box.minX + 1,
    height: box.maxY - box.minY + 1,
    avgColorDiff: Math.round(box.totalColorDiff / box.pixelCount),
  }));

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d')!;
  diffCtx.drawImage(tmpA, 0, 0);

  const overlay = diffCtx.getImageData(0, 0, width, height);
  for (let i = 0; i < totalPixels; i++) {
    if (diffMask[i]) {
      overlay.data[i * 4] = 255;
      overlay.data[i * 4 + 1] = 0;
      overlay.data[i * 4 + 2] = 0;
      overlay.data[i * 4 + 3] = 64;
    }
  }
  diffCtx.putImageData(overlay, 0, 0);

  diffRegions.forEach((region) => {
    diffCtx.strokeStyle = '#FF0000';
    diffCtx.lineWidth = 1;
    diffCtx.strokeRect(region.x, region.y, region.width, region.height);
  });

  return {
    totalDiffPixels,
    totalPixels,
    diffPercent: parseFloat(((totalDiffPixels / totalPixels) * 100).toFixed(2)),
    diffRegions,
    diffImageDataURL: diffCanvas.toDataURL(),
  };
}
