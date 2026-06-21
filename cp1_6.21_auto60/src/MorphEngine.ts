export interface Point {
  x: number;
  y: number;
}

export interface GlyphPath {
  points: Point[];
  closed: boolean;
}

export interface FontOutline {
  glyphs: GlyphPath[];
  width: number;
  height: number;
}

export type EasingFunction = (t: number) => number;

class MorphEngineClass {
  private controlPoints: number = 50;

  setControlPoints(count: number): void {
    this.controlPoints = Math.max(10, Math.min(200, count));
  }

  getControlPoints(): number {
    return this.controlPoints;
  }

  morph(
    startOutline: FontOutline,
    endOutline: FontOutline,
    progress: number,
    easingFn?: EasingFunction
  ): FontOutline {
    const t = easingFn ? easingFn(progress) : progress;
    const clampedT = Math.max(0, Math.min(1, t));

    const maxGlyphs = Math.max(startOutline.glyphs.length, endOutline.glyphs.length);
    const morphedGlyphs: GlyphPath[] = [];

    for (let i = 0; i < maxGlyphs; i++) {
      const startGlyph = startOutline.glyphs[i] || { points: [], closed: true };
      const endGlyph = endOutline.glyphs[i] || { points: [], closed: true };

      const targetPoints = Math.max(
        this.controlPoints,
        Math.max(startGlyph.points.length, endGlyph.points.length)
      );

      const resampledStart = this.resamplePath(startGlyph.points, targetPoints);
      const resampledEnd = this.resamplePath(endGlyph.points, targetPoints);

      const morphedPoints: Point[] = [];
      for (let j = 0; j < targetPoints; j++) {
        const sp = resampledStart[j] || { x: 0, y: 0 };
        const ep = resampledEnd[j] || { x: 0, y: 0 };
        morphedPoints.push({
          x: sp.x + (ep.x - sp.x) * clampedT,
          y: sp.y + (ep.y - sp.y) * clampedT
        });
      }

      morphedGlyphs.push({
        points: morphedPoints,
        closed: startGlyph.closed || endGlyph.closed
      });
    }

    return {
      glyphs: morphedGlyphs,
      width: startOutline.width + (endOutline.width - startOutline.width) * clampedT,
      height: startOutline.height + (endOutline.height - startOutline.height) * clampedT
    };
  }

  resamplePath(path: Point[], targetLength: number): Point[] {
    if (path.length === 0 || targetLength <= 0) {
      return [];
    }

    if (path.length === 1) {
      return Array(targetLength).fill(null).map(() => ({ ...path[0] }));
    }

    const totalLength = this.getPathLength(path);
    const result: Point[] = [];
    const step = totalLength / (targetLength - 1);

    result.push({ ...path[0] });

    let accumulated = 0;
    let currentIndex = 0;

    for (let i = 1; i < targetLength - 1; i++) {
      const targetDist = step * i;

      while (currentIndex < path.length - 1) {
        const segmentLength = this.getDistance(path[currentIndex], path[currentIndex + 1]);

        if (accumulated + segmentLength >= targetDist) {
          const remaining = targetDist - accumulated;
          const ratio = remaining / segmentLength;
          result.push({
            x: path[currentIndex].x + (path[currentIndex + 1].x - path[currentIndex].x) * ratio,
            y: path[currentIndex].y + (path[currentIndex + 1].y - path[currentIndex].y) * ratio
          });
          break;
        }

        accumulated += segmentLength;
        currentIndex++;
      }
    }

    result.push({ ...path[path.length - 1] });
    return result;
  }

  private getPathLength(path: Point[]): number {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
      length += this.getDistance(path[i], path[i + 1]);
    }
    return length;
  }

  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  extractOutline(
    text: string,
    fontFamily: string,
    fontSize: number,
    canvas: HTMLCanvasElement
  ): FontOutline {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { glyphs: [], width: 0, height: 0 };
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.textBaseline = 'top';

    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = fontSize;

    canvas.width = Math.ceil(width) + 20;
    canvas.height = Math.ceil(height) + 20;

    const ctx2 = canvas.getContext('2d');
    if (!ctx2) {
      return { glyphs: [], width: 0, height: 0 };
    }

    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.font = `${fontSize}px "${fontFamily}"`;
    ctx2.textBaseline = 'top';
    ctx2.fillStyle = '#000';
    ctx2.fillText(text, 10, 10);

    const imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const contours = this.findContours(pixels, canvas.width, canvas.height);
    const glyphs: GlyphPath[] = contours.map(contour => ({
      points: contour,
      closed: true
    }));

    return { glyphs, width, height };
  }

  private findContours(
    pixels: Uint8ClampedArray,
    width: number,
    height: number
  ): Point[][] {
    const visited = new Set<number>();
    const contours: Point[][] = [];
    const threshold = 128;

    const getPixel = (x: number, y: number): number => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      const idx = (y * width + x) * 4;
      return pixels[idx + 3];
    };

    const isEdge = (x: number, y: number): boolean => {
      if (getPixel(x, y) < threshold) return false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (getPixel(x + dx, y + dy) < threshold) return true;
        }
      }
      return false;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = y * width + x;
        if (visited.has(key) || !isEdge(x, y)) continue;

        const contour: Point[] = [];
        let cx = x;
        let cy = y;

        let startX = cx;
        let startY = cy;
        let steps = 0;
        const maxSteps = width * height;

        do {
          const ckey = cy * width + cx;
          if (visited.has(ckey)) break;
          visited.add(ckey);

          contour.push({ x: cx, y: cy });

          const neighbors = [
            { dx: 1, dy: 0 },
            { dx: 1, dy: 1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: -1, dy: -1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: -1 }
          ];

          let found = false;
          for (const n of neighbors) {
            const nx = cx + n.dx;
            const ny = cy + n.dy;
            const nkey = ny * width + nx;
            if (!visited.has(nkey) && isEdge(nx, ny)) {
              cx = nx;
              cy = ny;
              found = true;
              break;
            }
          }

          if (!found) break;
          steps++;
        } while ((cx !== startX || cy !== startY) && steps < maxSteps);

        if (contour.length >= 3) {
          contours.push(contour);
        }
      }
    }

    contours.sort((a, b) => b.length - a.length);
    return contours.slice(0, 20);
  }

  createEasingFromBezier(cp1x: number, cp1y: number, cp2x: number, cp2y: number): EasingFunction {
    const cx = 3 * cp1x;
    const bx = 3 * (cp2x - cp1x) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * cp1y;
    const by = 3 * (cp2y - cp1y) - cy;
    const ay = 1 - cy - by;

    const sampleCurveX = (t: number): number => {
      return ((ax * t + bx) * t + cx) * t;
    };

    const sampleCurveY = (t: number): number => {
      return ((ay * t + by) * t + cy) * t;
    };

    const sampleCurveDerivativeX = (t: number): number => {
      return (3 * ax * t + 2 * bx) * t + cx;
    };

    const solveCurveX = (x: number): number => {
      let t2 = x;
      for (let i = 0; i < 8; i++) {
        const x2 = sampleCurveX(t2) - x;
        if (Math.abs(x2) < 1e-6) return t2;
        const d2 = sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;
        t2 = t2 - x2 / d2;
      }

      let t0 = 0;
      let t1 = 1;
      t2 = x;

      if (t2 < t0) return t0;
      if (t2 > t1) return t1;

      while (t0 < t1) {
        const x2 = sampleCurveX(t2);
        if (Math.abs(x2 - x) < 1e-6) return t2;
        if (x > x2) t0 = t2;
        else t1 = t2;
        t2 = (t1 - t0) * 0.5 + t0;
      }

      return t2;
    };

    return (t: number): number => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return sampleCurveY(solveCurveX(t));
    };
  }

  elasticEaseInOut(t: number): number {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    if (t < 0.5) {
      return -0.5 * Math.pow(2, 20 * t - 10) * Math.sin((2 * t * 2 - 2 * s) * Math.PI / p);
    }
    return 0.5 * Math.pow(2, -20 * t + 10) * Math.sin((2 * t * 2 - 2 * s) * Math.PI / p) + 1;
  }

  linearEase(t: number): number {
    return t;
  }
}

export const MorphEngine = new MorphEngineClass();
export default MorphEngine;
