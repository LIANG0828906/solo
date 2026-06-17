import { CharGlyph, FontGeneProfile, Point } from '../types';

export class StyleTransfer {
  static applyGenes(glyph: CharGlyph, genes: FontGeneProfile): CharGlyph {
    let outline = this.cloneOutline(glyph.outline);

    outline = this.applyCurveTension(outline, genes.curveTension);
    outline = this.applyWeight(outline, genes.weight);
    outline = this.applySlant(outline, genes.slant);
    outline = this.applySerifs(outline, genes.serifAmount);
    outline = this.applyDecorations(outline, genes.decorationComplexity);

    return {
      ...glyph,
      outline,
      boundingBox: this.calculateBoundingBox(outline),
    };
  }

  private static cloneOutline(outline: Point[][]): Point[][] {
    return outline.map((path) => path.map((p) => ({ ...p })));
  }

  private static calculateBoundingBox(outline: Point[][]) {
    let minX = Infinity,
      minY = Infinity,
      maxX = 0,
      maxY = 0;
    for (const path of outline) {
      for (const p of path) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private static applyWeight(outline: Point[][], weight: number): Point[][] {
    if (weight === 50) return outline;

    const factor = 0.5 + (weight / 100) * 1.5;
    const center = this.getCenter(outline);

    return outline.map((path) =>
      path.map((p) => ({
        x: center.x + (p.x - center.x) * factor,
        y: center.y + (p.y - center.y) * factor,
      }))
    );
  }

  private static applySlant(outline: Point[][], slant: number): Point[][] {
    if (slant === 0) return outline;

    const shear = Math.tan((slant * Math.PI) / 180);
    const centerY = this.getCenter(outline).y;

    return outline.map((path) =>
      path.map((p) => ({
        x: p.x + (p.y - centerY) * shear,
        y: p.y,
      }))
    );
  }

  private static applySerifs(outline: Point[][], amount: number): Point[][] {
    if (amount <= 0) return outline;

    const result: Point[][] = [];

    for (const path of outline) {
      if (path.length < 2) {
        result.push(path);
        continue;
      }

      const serifPath: Point[] = [];
      const segmentLength = 3;

      for (let i = 0; i < path.length; i++) {
        serifPath.push(path[i]);

        if (i % segmentLength === 0 && i > 0 && i < path.length - 1) {
          const prev = path[i - 1];
          const curr = path[i];
          const next = path[i + 1];

          const angle = this.getSegmentAngle(prev, curr, next);
          if (Math.abs(angle - Math.PI / 2) < 0.5 || Math.abs(angle) < 0.3) {
            const perp = this.getPerpendicular(prev, curr, amount);
            serifPath.push({
              x: curr.x + perp.x,
              y: curr.y + perp.y,
            });
            serifPath.push(curr);
            serifPath.push({
              x: curr.x - perp.x,
              y: curr.y - perp.y,
            });
            serifPath.push(curr);
          }
        }
      }

      result.push(serifPath);
    }

    return result;
  }

  private static applyCurveTension(outline: Point[][], tension: number): Point[][] {
    if (tension === 50) return outline;

    const factor = (tension - 50) / 50;

    return outline.map((path) => {
      if (path.length < 4) return path;

      const result: Point[] = [];
      const step = 0.2;

      for (let i = 0; i < path.length - 1; i++) {
        const p0 = path[Math.max(0, i - 1)];
        const p1 = path[i];
        const p2 = path[Math.min(path.length - 1, i + 1)];
        const p3 = path[Math.min(path.length - 1, i + 2)];

        for (let t = 0; t < 1; t += step) {
          const point = this.catmullRom(p0, p1, p2, p3, t, 0.5 + factor * 0.5);
          result.push(point);
        }
      }

      result.push(path[path.length - 1]);
      return result;
    });
  }

  private static applyDecorations(
    outline: Point[][],
    complexity: number
  ): Point[][] {
    if (complexity <= 0) return outline;

    const result = this.cloneOutline(outline);

    for (let i = 0; i < complexity; i++) {
      for (const path of result) {
        if (path.length < 5) continue;

        const insertPos = Math.floor(Math.random() * (path.length - 2)) + 1;
        const prev = path[insertPos - 1];
        const curr = path[insertPos];
        const next = path[insertPos + 1];

        const perp = this.getPerpendicular(prev, next, 0.5 + complexity * 0.3);
        const mid = {
          x: (prev.x + next.x) / 2,
          y: (prev.y + next.y) / 2,
        };

        const direction = i % 2 === 0 ? 1 : -1;
        path.splice(insertPos, 0, {
          x: mid.x + perp.x * direction,
          y: mid.y + perp.y * direction,
        });
      }
    }

    return result;
  }

  private static getCenter(outline: Point[][]): Point {
    let sumX = 0,
      sumY = 0,
      count = 0;
    for (const path of outline) {
      for (const p of path) {
        sumX += p.x;
        sumY += p.y;
        count++;
      }
    }
    return {
      x: sumX / count,
      y: sumY / count,
    };
  }

  private static getSegmentAngle(p0: Point, p1: Point, p2: Point): number {
    const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2 || 1))));
  }

  private static getPerpendicular(p0: Point, p1: Point, length: number): Point {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: (-dy / mag) * length,
      y: (dx / mag) * length,
    };
  }

  private static catmullRom(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    t: number,
    tension: number
  ): Point {
    const t2 = t * t;
    const t3 = t2 * t;

    const s = (1 - tension) / 2;

    const b1 = s * (-t3 + 2 * t2 - t);
    const b2 = s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1);
    const b3 = s * (t3 - 2 * t2 + t) + (-2 * t3 + 3 * t2);
    const b4 = s * (t3 - t2);

    return {
      x: p0.x * b1 + p1.x * b2 + p2.x * b3 + p3.x * b4,
      y: p0.y * b1 + p1.y * b2 + p2.y * b3 + p3.y * b4,
    };
  }

  public static transformAllGlyphs(
    glyphs: CharGlyph[],
    genes: FontGeneProfile
  ): Map<string, CharGlyph> {
    const transformed = new Map<string, CharGlyph>();
    for (const glyph of glyphs) {
      transformed.set(glyph.char, this.applyGenes(glyph, genes));
    }
    return transformed;
  }
}
