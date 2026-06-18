import type { Stroke, RecognizedSegment } from '@/store/useCanvasStore';

interface SymbolFeature {
  strokeCount: number;
  aspectRatio: number;
  directionChanges: number;
  pathLengthRatio: number;
  startRegion: number;
  endRegion: number;
  horizontalRatio: number;
  verticalRatio: number;
  closedness: number;
  density: number;
}

interface SymbolEntry {
  latex: string;
  display: string;
  features: SymbolFeature;
  tolerance: number;
}

const CLUSTER_DISTANCE = 40;

const SYMBOL_DB: SymbolEntry[] = [
  {
    latex: '+',
    display: '+',
    features: {
      strokeCount: 2, aspectRatio: 1, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 2, endRegion: 1,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '-',
    display: '-',
    features: {
      strokeCount: 1, aspectRatio: 4, directionChanges: 0,
      pathLengthRatio: 1.1, startRegion: 2, endRegion: 3,
      horizontalRatio: 0.9, verticalRatio: 0.1, closedness: 0, density: 0.2,
    },
    tolerance: 0.6,
  },
  {
    latex: '\\times',
    display: '×',
    features: {
      strokeCount: 2, aspectRatio: 1, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\div',
    display: '÷',
    features: {
      strokeCount: 3, aspectRatio: 2.5, directionChanges: 0,
      pathLengthRatio: 1.5, startRegion: 1, endRegion: 2,
      horizontalRatio: 0.8, verticalRatio: 0.3, closedness: 0, density: 0.25,
    },
    tolerance: 0.55,
  },
  {
    latex: '=',
    display: '=',
    features: {
      strokeCount: 2, aspectRatio: 3, directionChanges: 0,
      pathLengthRatio: 2.2, startRegion: 2, endRegion: 3,
      horizontalRatio: 0.9, verticalRatio: 0.2, closedness: 0, density: 0.25,
    },
    tolerance: 0.55,
  },
  {
    latex: '\\int',
    display: '∫',
    features: {
      strokeCount: 1, aspectRatio: 2.5, directionChanges: 3,
      pathLengthRatio: 4.0, startRegion: 1, endRegion: 2,
      horizontalRatio: 0.3, verticalRatio: 0.7, closedness: 0.1, density: 0.35,
    },
    tolerance: 0.55,
  },
  {
    latex: '\\sum',
    display: 'Σ',
    features: {
      strokeCount: 1, aspectRatio: 1.2, directionChanges: 3,
      pathLengthRatio: 3.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.6, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\sqrt{}',
    display: '√',
    features: {
      strokeCount: 1, aspectRatio: 1.5, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 2, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\alpha',
    display: 'α',
    features: {
      strokeCount: 1, aspectRatio: 1.2, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 3, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0.2, density: 0.35,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\beta',
    display: 'β',
    features: {
      strokeCount: 1, aspectRatio: 0.7, directionChanges: 3,
      pathLengthRatio: 4.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.4, verticalRatio: 0.6, closedness: 0.3, density: 0.4,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\gamma',
    display: 'γ',
    features: {
      strokeCount: 1, aspectRatio: 1.0, directionChanges: 2,
      pathLengthRatio: 2.8, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\pi',
    display: 'π',
    features: {
      strokeCount: 1, aspectRatio: 1.5, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.7, verticalRatio: 0.4, closedness: 0, density: 0.35,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\theta',
    display: 'θ',
    features: {
      strokeCount: 1, aspectRatio: 1.0, directionChanges: 2,
      pathLengthRatio: 3.5, startRegion: 0, endRegion: 2,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0.5, density: 0.4,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\lambda',
    display: 'λ',
    features: {
      strokeCount: 1, aspectRatio: 0.6, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.4, verticalRatio: 0.6, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\infty',
    display: '∞',
    features: {
      strokeCount: 1, aspectRatio: 2.0, directionChanges: 3,
      pathLengthRatio: 5.0, startRegion: 2, endRegion: 2,
      horizontalRatio: 0.7, verticalRatio: 0.3, closedness: 0.8, density: 0.35,
    },
    tolerance: 0.55,
  },
  {
    latex: '\\partial',
    display: '∂',
    features: {
      strokeCount: 1, aspectRatio: 1.0, directionChanges: 3,
      pathLengthRatio: 4.0, startRegion: 0, endRegion: 2,
      horizontalRatio: 0.4, verticalRatio: 0.6, closedness: 0.4, density: 0.4,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\nabla',
    display: '∇',
    features: {
      strokeCount: 1, aspectRatio: 1.2, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.6, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '<',
    display: '<',
    features: {
      strokeCount: 1, aspectRatio: 1.0, directionChanges: 1,
      pathLengthRatio: 2.0, startRegion: 3, endRegion: 1,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.2,
    },
    tolerance: 0.55,
  },
  {
    latex: '>',
    display: '>',
    features: {
      strokeCount: 1, aspectRatio: 1.0, directionChanges: 1,
      pathLengthRatio: 2.0, startRegion: 1, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.2,
    },
    tolerance: 0.55,
  },
  {
    latex: '(',
    display: '(',
    features: {
      strokeCount: 1, aspectRatio: 0.5, directionChanges: 1,
      pathLengthRatio: 3.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.3, verticalRatio: 0.7, closedness: 0, density: 0.25,
    },
    tolerance: 0.5,
  },
  {
    latex: ')',
    display: ')',
    features: {
      strokeCount: 1, aspectRatio: 0.5, directionChanges: 1,
      pathLengthRatio: 3.0, startRegion: 1, endRegion: 2,
      horizontalRatio: 0.3, verticalRatio: 0.7, closedness: 0, density: 0.25,
    },
    tolerance: 0.5,
  },
  {
    latex: '[',
    display: '[',
    features: {
      strokeCount: 1, aspectRatio: 0.4, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.3, verticalRatio: 0.7, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: ']',
    display: ']',
    features: {
      strokeCount: 1, aspectRatio: 0.4, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 1, endRegion: 2,
      horizontalRatio: 0.3, verticalRatio: 0.7, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '\\frac{}{}',
    display: '─',
    features: {
      strokeCount: 1, aspectRatio: 5, directionChanges: 0,
      pathLengthRatio: 1.1, startRegion: 2, endRegion: 3,
      horizontalRatio: 0.95, verticalRatio: 0.05, closedness: 0, density: 0.15,
    },
    tolerance: 0.65,
  },
  {
    latex: '0', display: '0',
    features: {
      strokeCount: 1, aspectRatio: 0.8, directionChanges: 1,
      pathLengthRatio: 3.5, startRegion: 0, endRegion: 0,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0.9, density: 0.4,
    },
    tolerance: 0.55,
  },
  {
    latex: '1', display: '1',
    features: {
      strokeCount: 1, aspectRatio: 0.3, directionChanges: 0,
      pathLengthRatio: 1.2, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.2, verticalRatio: 0.8, closedness: 0, density: 0.2,
    },
    tolerance: 0.55,
  },
  {
    latex: '2', display: '2',
    features: {
      strokeCount: 1, aspectRatio: 0.7, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.35,
    },
    tolerance: 0.5,
  },
  {
    latex: '3', display: '3',
    features: {
      strokeCount: 1, aspectRatio: 0.7, directionChanges: 3,
      pathLengthRatio: 3.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.4, verticalRatio: 0.6, closedness: 0, density: 0.35,
    },
    tolerance: 0.5,
  },
  {
    latex: '4', display: '4',
    features: {
      strokeCount: 2, aspectRatio: 0.6, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.4, verticalRatio: 0.6, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: '5', display: '5',
    features: {
      strokeCount: 1, aspectRatio: 0.7, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.35,
    },
    tolerance: 0.5,
  },
  {
    latex: '6', display: '6',
    features: {
      strokeCount: 1, aspectRatio: 0.8, directionChanges: 2,
      pathLengthRatio: 3.5, startRegion: 0, endRegion: 2,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0.6, density: 0.4,
    },
    tolerance: 0.5,
  },
  {
    latex: '7', display: '7',
    features: {
      strokeCount: 1, aspectRatio: 0.6, directionChanges: 1,
      pathLengthRatio: 2.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.25,
    },
    tolerance: 0.55,
  },
  {
    latex: '8', display: '8',
    features: {
      strokeCount: 1, aspectRatio: 0.8, directionChanges: 3,
      pathLengthRatio: 4.5, startRegion: 0, endRegion: 0,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0.9, density: 0.45,
    },
    tolerance: 0.5,
  },
  {
    latex: '9', display: '9',
    features: {
      strokeCount: 1, aspectRatio: 0.8, directionChanges: 2,
      pathLengthRatio: 3.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0.6, density: 0.4,
    },
    tolerance: 0.5,
  },
  {
    latex: 'x', display: 'x',
    features: {
      strokeCount: 2, aspectRatio: 1, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.5,
  },
  {
    latex: 'y', display: 'y',
    features: {
      strokeCount: 1, aspectRatio: 0.6, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.4, verticalRatio: 0.6, closedness: 0, density: 0.3,
    },
    tolerance: 0.55,
  },
  {
    latex: 'z', display: 'z',
    features: {
      strokeCount: 1, aspectRatio: 1.5, directionChanges: 2,
      pathLengthRatio: 2.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.7, verticalRatio: 0.3, closedness: 0, density: 0.25,
    },
    tolerance: 0.55,
  },
  {
    latex: 'n', display: 'n',
    features: {
      strokeCount: 1, aspectRatio: 0.8, directionChanges: 2,
      pathLengthRatio: 3.0, startRegion: 3, endRegion: 3,
      horizontalRatio: 0.5, verticalRatio: 0.5, closedness: 0, density: 0.3,
    },
    tolerance: 0.55,
  },
  {
    latex: 'i', display: 'i',
    features: {
      strokeCount: 2, aspectRatio: 0.3, directionChanges: 0,
      pathLengthRatio: 1.5, startRegion: 0, endRegion: 3,
      horizontalRatio: 0.2, verticalRatio: 0.8, closedness: 0, density: 0.25,
    },
    tolerance: 0.55,
  },
];

type FSMState = 'idle' | 'collecting' | 'classifying' | 'assembling';

export class FormulaRecognizer {
  private state: FSMState = 'idle';
  private pendingTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 150;

  recognize(strokes: Stroke[]): {
    latex: string;
    confidence: number;
    segments: RecognizedSegment[];
  } {
    this.state = 'collecting';

    if (strokes.length === 0) {
      this.state = 'idle';
      return { latex: '', confidence: 0, segments: [] };
    }

    this.state = 'classifying';

    const clusters = this.clusterStrokes(strokes);

    const segments: RecognizedSegment[] = [];

    for (const cluster of clusters) {
      const feature = this.extractFeatures(cluster.strokes);
      const match = this.matchSymbol(feature);
      const bounds = this.getClusterBounds(cluster.strokes);

      segments.push({
        latex: match.latex,
        confidence: match.confidence,
        bounds,
        strokeIds: cluster.strokes.map((s) => s.id),
      });
    }

    this.state = 'assembling';

    const latex = this.assembleLatex(segments);

    this.state = 'idle';

    const avgConfidence =
      segments.length > 0
        ? segments.reduce((s, seg) => s + seg.confidence, 0) / segments.length
        : 0;

    return { latex, confidence: avgConfidence, segments };
  }

  getState(): FSMState {
    return this.state;
  }

  private clusterStrokes(strokes: Stroke[]): StrokeCluster[] {
    if (strokes.length === 0) return [];

    const centers = strokes.map((s) => this.strokeCenter(s));
    const visited = new Set<number>();
    const clusters: StrokeCluster[] = [];

    for (let i = 0; i < strokes.length; i++) {
      if (visited.has(i)) continue;

      const cluster: Stroke[] = [strokes[i]];
      visited.add(i);
      const queue = [i];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (let j = 0; j < strokes.length; j++) {
          if (visited.has(j)) continue;
          const dist = Math.hypot(
            centers[curr].x - centers[j].x,
            centers[curr].y - centers[j].y
          );
          if (dist < CLUSTER_DISTANCE) {
            visited.add(j);
            cluster.push(strokes[j]);
            queue.push(j);
          }
        }
      }

      clusters.push({ strokes: cluster });
    }

    return clusters;
  }

  private strokeCenter(stroke: Stroke): { x: number; y: number } {
    const pts = stroke.points;
    const sx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const sy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x: sx, y: sy };
  }

  private extractFeatures(strokes: Stroke[]): SymbolFeature {
    const allPoints = strokes.flatMap((s) => s.points);
    if (allPoints.length === 0) {
      return {
        strokeCount: 0, aspectRatio: 1, directionChanges: 0,
        pathLengthRatio: 0, startRegion: 0, endRegion: 0,
        horizontalRatio: 0, verticalRatio: 0, closedness: 0, density: 0,
      };
    }

    const bounds = this.getBounds(allPoints);
    const aspectRatio =
      bounds.height > 0 ? bounds.width / bounds.height : 1;

    const pathLength = this.totalPathLength(strokes);
    const diagonal = Math.hypot(bounds.width, bounds.height);
    const pathLengthRatio = diagonal > 0 ? pathLength / diagonal : 1;

    const directionChanges = this.countDirectionChanges(strokes);

    const startRegion = this.getRegion(
      allPoints[0],
      bounds
    );
    const endRegion = this.getRegion(
      allPoints[allPoints.length - 1],
      bounds
    );

    let hLen = 0;
    let vLen = 0;
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        const dx = Math.abs(stroke.points[i].x - stroke.points[i - 1].x);
        const dy = Math.abs(stroke.points[i].y - stroke.points[i - 1].y);
        hLen += dx;
        vLen += dy;
      }
    }
    const total = hLen + vLen || 1;
    const horizontalRatio = hLen / total;
    const verticalRatio = vLen / total;

    const first = allPoints[0];
    const last = allPoints[allPoints.length - 1];
    const closeDist = Math.hypot(first.x - last.x, first.y - last.y);
    const closedness = diagonal > 0 ? 1 - closeDist / diagonal : 0;

    const area = Math.max(bounds.width * bounds.height, 1);
    const density = pathLength / Math.sqrt(area);

    return {
      strokeCount: strokes.length,
      aspectRatio,
      directionChanges,
      pathLengthRatio,
      startRegion,
      endRegion,
      horizontalRatio,
      verticalRatio,
      closedness: Math.max(0, Math.min(1, closedness)),
      density: Math.min(density / 5, 1),
    };
  }

  private matchSymbol(feature: SymbolFeature): {
    latex: string;
    confidence: number;
  } {
    let bestMatch = '?';
    let bestDist = Infinity;

    for (const entry of SYMBOL_DB) {
      const dist = this.featureDistance(feature, entry.features, entry.tolerance);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = entry.latex;
      }
    }

    const confidence = Math.max(0, Math.min(1, 1 - bestDist / 3));
    return { latex: bestMatch, confidence };
  }

  private featureDistance(
    a: SymbolFeature,
    b: SymbolFeature,
    tolerance: number
  ): number {
    const weights = {
      strokeCount: 3,
      aspectRatio: 1.5,
      directionChanges: 1.2,
      pathLengthRatio: 0.8,
      startRegion: 0.5,
      endRegion: 0.5,
      horizontalRatio: 1.0,
      verticalRatio: 1.0,
      closedness: 1.5,
      density: 0.8,
    };

    let dist = 0;
    const keys = Object.keys(weights) as (keyof typeof weights)[];

    for (const key of keys) {
      const diff = Math.abs(a[key] - b[key]);
      const weight = weights[key];
      const normalized = diff / (tolerance + 0.01);
      dist += weight * normalized * normalized;
    }

    return Math.sqrt(dist);
  }

  private assembleLatex(segments: RecognizedSegment[]): string {
    if (segments.length === 0) return '';
    if (segments.length === 1) return this.wrapSegment(segments[0]);

    const sorted = [...segments].sort((a, b) => {
      const dx = a.bounds.x - b.bounds.x;
      return Math.abs(dx) > 5 ? dx : a.bounds.y - b.bounds.y;
    });

    const lines: string[] = [];
    let currentLine: RecognizedSegment[] = [sorted[0]];
    const avgHeight =
      sorted.reduce((s, seg) => s + seg.bounds.height, 0) / sorted.length;
    const baselineThreshold = avgHeight * 0.6;

    for (let i = 1; i < sorted.length; i++) {
      const prev = currentLine[currentLine.length - 1];
      const curr = sorted[i];
      const yDiff = Math.abs(
        prev.bounds.y + prev.bounds.height / 2 - (curr.bounds.y + curr.bounds.height / 2)
      );

      if (yDiff < baselineThreshold) {
        currentLine.push(curr);
      } else {
        lines.push(this.assembleLine(currentLine));
        currentLine = [curr];
      }
    }
    lines.push(this.assembleLine(currentLine));

    return lines.join(' \\\\ ');
  }

  private assembleLine(segments: RecognizedSegment[]): string {
    if (segments.length === 0) return '';
    if (segments.length === 1) return this.wrapSegment(segments[0]);

    const avgHeight =
      segments.reduce((s, seg) => s + seg.bounds.height, 0) / segments.length;
    const baseY = Math.max(...segments.map((s) => s.bounds.y + s.bounds.height));

    let result = '';
    let i = 0;

    while (i < segments.length) {
      const seg = segments[i];
      const segMidY = seg.bounds.y + seg.bounds.height / 2;
      const baselineMidY = baseY - avgHeight / 2;
      const verticalOffset = segMidY - baselineMidY;

      if (seg.latex === '\\frac{}{}') {
        const above = segments.filter(
          (s) =>
            s !== seg &&
            s.bounds.y + s.bounds.height < seg.bounds.y &&
            s.bounds.x >= seg.bounds.x - 10 &&
            s.bounds.x <= seg.bounds.x + seg.bounds.width + 10
        );
        const below = segments.filter(
          (s) =>
            s !== seg &&
            s.bounds.y > seg.bounds.y + seg.bounds.height &&
            s.bounds.x >= seg.bounds.x - 10 &&
            s.bounds.x <= seg.bounds.x + seg.bounds.width + 10
        );

        if (above.length > 0 || below.length > 0) {
          const numLatex = above.map((s) => s.latex).join(' ');
          const denLatex = below.map((s) => s.latex).join(' ');
          result += `\\frac{${numLatex || '?'}}{${denLatex || '?'}} `;
          i += 1 + above.length + below.length;
          continue;
        }
      }

      if (verticalOffset < -avgHeight * 0.35) {
        result += `^{${this.wrapSegment(seg)}} `;
      } else if (verticalOffset > avgHeight * 0.35) {
        result += `_{${this.wrapSegment(seg)}} `;
      } else {
        result += this.wrapSegment(seg) + ' ';
      }

      i++;
    }

    return result.trim();
  }

  private wrapSegment(seg: RecognizedSegment): string {
    if (seg.latex === '\\sqrt{}') return '\\sqrt{}';
    if (seg.latex === '\\frac{}{}') return '\\frac{}{}';
    return seg.latex;
  }

  private getBounds(points: { x: number; y: number }[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  private getRegion(
    point: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): number {
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;
    if (point.x < midX && point.y < midY) return 0;
    if (point.x >= midX && point.y < midY) return 1;
    if (point.x < midX && point.y >= midY) return 2;
    return 3;
  }

  private totalPathLength(strokes: Stroke[]): number {
    let total = 0;
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        const dx = stroke.points[i].x - stroke.points[i - 1].x;
        const dy = stroke.points[i].y - stroke.points[i - 1].y;
        total += Math.sqrt(dx * dx + dy * dy);
      }
    }
    return total;
  }

  private countDirectionChanges(strokes: Stroke[]): number {
    let changes = 0;
    const ANGLE_THRESHOLD = Math.PI / 4;

    for (const stroke of strokes) {
      if (stroke.points.length < 3) continue;

      const step = Math.max(1, Math.floor(stroke.points.length / 20));
      const sampled: { x: number; y: number }[] = [];
      for (let i = 0; i < stroke.points.length; i += step) {
        sampled.push(stroke.points[i]);
      }
      if (sampled[sampled.length - 1] !== stroke.points[stroke.points.length - 1]) {
        sampled.push(stroke.points[stroke.points.length - 1]);
      }

      if (sampled.length < 3) continue;

      let prevAngle = Math.atan2(
        sampled[1].y - sampled[0].y,
        sampled[1].x - sampled[0].x
      );

      for (let i = 2; i < sampled.length; i++) {
        const angle = Math.atan2(
          sampled[i].y - sampled[i - 1].y,
          sampled[i].x - sampled[i - 1].x
        );
        let delta = angle - prevAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        if (Math.abs(delta) > ANGLE_THRESHOLD) {
          changes++;
        }
        prevAngle = angle;
      }
    }

    return changes;
  }

  private getClusterBounds(strokes: Stroke[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const allPoints = strokes.flatMap((s) => s.points);
    return this.getBounds(allPoints);
  }
}

interface StrokeCluster {
  strokes: Stroke[];
}
