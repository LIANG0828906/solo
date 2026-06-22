import type { BuildingData } from './main';

export class ImageParser {
  parse(image: HTMLImageElement): BuildingData[] {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const pixels = imageData.data;

    const colorGrid: string[][] = [];
    for (let y = 0; y < size; y++) {
      const row: string[] = [];
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        row.push(this.quantizeColor(r, g, b, brightness));
      }
      colorGrid.push(row);
    }

    const edgeGrid: boolean[][] = [];
    for (let y = 0; y < size; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < size; x++) {
        let isEdge = false;
        if (x < size - 1) {
          const c1 = colorGrid[y][x];
          const c2 = colorGrid[y][x + 1];
          if (c1 !== c2) isEdge = true;
        }
        if (y < size - 1) {
          const c1 = colorGrid[y][x];
          const c2 = colorGrid[y + 1][x];
          if (c1 !== c2) isEdge = true;
        }
        row.push(isEdge);
      }
      edgeGrid.push(row);
    }

    const visited: boolean[][] = Array.from({ length: size }, () =>
      Array(size).fill(false),
    );

    const regions: { color: string; pixels: [number, number][] }[] = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (visited[y][x]) continue;
        const color = colorGrid[y][x];
        const pixels: [number, number][] = [];
        const queue: [number, number][] = [[x, y]];
        visited[y][x] = true;
        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          pixels.push([cx, cy]);
          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];
          for (const [nx, ny] of neighbors) {
            if (
              nx >= 0 && nx < size && ny >= 0 && ny < size &&
              !visited[ny][nx] && colorGrid[ny][nx] === color
            ) {
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }
        if (pixels.length >= 8) {
          regions.push({ color, pixels });
        }
      }
    }

    const buildings: BuildingData[] = [];
    const scaleFactor = 30 / size;

    regions
      .sort((a, b) => b.pixels.length - a.pixels.length)
      .slice(0, 20)
      .forEach((region, index) => {
        let minX = Infinity,
          maxX = -Infinity,
          minZ = Infinity,
          maxZ = -Infinity;
        let totalR = 0,
          totalG = 0,
          totalB = 0,
          count = 0;

        for (const [px, py] of region.pixels) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minZ) minZ = py;
          if (py > maxZ) maxZ = py;
          const i = (py * size + px) * 4;
          totalR += pixels[i];
          totalG += pixels[i + 1];
          totalB += pixels[i + 2];
          count++;
        }

        const w = Math.max((maxX - minX + 1) * scaleFactor, 0.5);
        const d = Math.max((maxZ - minZ + 1) * scaleFactor, 0.5);
        const avgBrightness =
          (totalR / count * 0.299 + totalG / count * 0.587 + totalB / count * 0.114) / 255;
        const height = Math.max(1, (1 - avgBrightness) * 12 + 1);

        const cx = ((minX + maxX) / 2 - size / 2) * scaleFactor;
        const cz = ((minZ + maxZ) / 2 - size / 2) * scaleFactor;

        const r = Math.round(totalR / count);
        const g = Math.round(totalG / count);
        const b = Math.round(totalB / count);
        const color = `rgb(${r},${g},${b})`;

        buildings.push({
          x: cx,
          z: cz,
          width: w,
          depth: d,
          height,
          color,
        });
      });

    return buildings;
  }

  private quantizeColor(
    r: number,
    g: number,
    b: number,
    brightness: number,
  ): string {
    const levels = 4;
    const qr = Math.round((r / 255) * levels) / levels;
    const qg = Math.round((g / 255) * levels) / levels;
    const qb = Math.round((b / 255) * levels) / levels;
    if (brightness > 0.85) return 'white';
    if (brightness < 0.15) return 'black';
    return `${qr},${qg},${qb}`;
  }
}
