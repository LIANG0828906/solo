import type { Point, CharacterSegment, Candidate, Stroke } from './types';

export interface RecognizerEvents {
  onRecognitionResult: (segmentId: string, candidates: Candidate[], bestChar: string) => void;
}

interface TemplateDef {
  char: string;
  strokes: number[][][];
}

export class Recognizer {
  private events: RecognizerEvents;
  private templates: TemplateDef[];
  private readonly NUM_SAMPLES = 32;

  constructor(events: RecognizerEvents) {
    this.events = events;
    this.templates = this.buildTemplates();
  }

  private buildTemplates(): TemplateDef[] {
    const t: TemplateDef[] = [];

    const add = (char: string, strokes: number[][][]) => t.push({ char, strokes });

    add('A', [[[0.5, 0.95], [0.2, 0.05], [0.8, 0.05], [0.5, 0.95]], [[0.25, 0.6], [0.75, 0.6]]]);
    add('B', [[[0.25, 0.05], [0.25, 0.95], [0.6, 0.95], [0.75, 0.8], [0.6, 0.6], [0.25, 0.6]], [[0.25, 0.6], [0.6, 0.6], [0.75, 0.4], [0.6, 0.05], [0.25, 0.05]]]);
    add('C', [[[0.8, 0.15], [0.5, 0.05], [0.25, 0.2], [0.2, 0.5], [0.25, 0.8], [0.5, 0.95], [0.8, 0.85]]]);
    add('D', [[[0.25, 0.05], [0.25, 0.95], [0.55, 0.95], [0.75, 0.75], [0.75, 0.25], [0.55, 0.05], [0.25, 0.05]]]);
    add('E', [[[0.25, 0.05], [0.25, 0.95]], [[0.25, 0.05], [0.75, 0.05]], [[0.25, 0.5], [0.6, 0.5]], [[0.25, 0.95], [0.75, 0.95]]]);
    add('F', [[[0.25, 0.05], [0.25, 0.95]], [[0.25, 0.05], [0.75, 0.05]], [[0.25, 0.5], [0.6, 0.5]]]);
    add('G', [[[0.8, 0.15], [0.5, 0.05], [0.25, 0.2], [0.2, 0.5], [0.25, 0.8], [0.5, 0.95], [0.8, 0.85], [0.8, 0.55], [0.55, 0.55]]]);
    add('H', [[[0.25, 0.05], [0.25, 0.95]], [[0.75, 0.05], [0.75, 0.95]], [[0.25, 0.5], [0.75, 0.5]]]);
    add('I', [[[0.5, 0.05], [0.5, 0.95]], [[0.35, 0.05], [0.65, 0.05]], [[0.35, 0.95], [0.65, 0.95]]]);
    add('J', [[[0.65, 0.05], [0.65, 0.8], [0.5, 0.95], [0.35, 0.8]], [[0.4, 0.05], [0.65, 0.05]]]);
    add('K', [[[0.25, 0.05], [0.25, 0.95]], [[0.25, 0.5], [0.75, 0.05]], [[0.25, 0.5], [0.75, 0.95]]]);
    add('L', [[[0.25, 0.05], [0.25, 0.95]], [[0.25, 0.95], [0.75, 0.95]]]);
    add('M', [[[0.2, 0.95], [0.2, 0.05], [0.5, 0.5], [0.8, 0.05], [0.8, 0.95]]]);
    add('N', [[[0.2, 0.95], [0.2, 0.05], [0.8, 0.95], [0.8, 0.05]]]);
    add('O', [[[0.5, 0.05], [0.25, 0.2], [0.2, 0.5], [0.25, 0.8], [0.5, 0.95], [0.75, 0.8], [0.8, 0.5], [0.75, 0.2], [0.5, 0.05]]]);
    add('P', [[[0.25, 0.05], [0.25, 0.95]], [[0.25, 0.05], [0.55, 0.05], [0.75, 0.25], [0.75, 0.45], [0.55, 0.55], [0.25, 0.55]]]);
    add('Q', [[[0.5, 0.05], [0.25, 0.2], [0.2, 0.5], [0.25, 0.8], [0.5, 0.95], [0.75, 0.8], [0.8, 0.5], [0.75, 0.2], [0.5, 0.05]], [[0.6, 0.7], [0.85, 0.95]]]);
    add('R', [[[0.25, 0.05], [0.25, 0.95]], [[0.25, 0.05], [0.55, 0.05], [0.75, 0.25], [0.75, 0.45], [0.55, 0.55], [0.25, 0.55]], [[0.25, 0.55], [0.75, 0.95]]]);
    add('S', [[[0.75, 0.1], [0.5, 0.05], [0.25, 0.15], [0.25, 0.4], [0.5, 0.5], [0.75, 0.6], [0.75, 0.85], [0.5, 0.95], [0.25, 0.85]]]);
    add('T', [[[0.5, 0.05], [0.5, 0.95]], [[0.2, 0.05], [0.8, 0.05]]]);
    add('U', [[[0.2, 0.05], [0.2, 0.75], [0.35, 0.95], [0.5, 0.95], [0.65, 0.95], [0.8, 0.75], [0.8, 0.05]]]);
    add('V', [[[0.15, 0.05], [0.5, 0.95], [0.85, 0.05]]]);
    add('W', [[[0.15, 0.05], [0.25, 0.95], [0.4, 0.5], [0.5, 0.95], [0.6, 0.5], [0.75, 0.95], [0.85, 0.05]]]);
    add('X', [[[0.2, 0.05], [0.8, 0.95]], [[0.8, 0.05], [0.2, 0.95]]]);
    add('Y', [[[0.2, 0.05], [0.5, 0.5], [0.8, 0.05]], [[0.5, 0.5], [0.5, 0.95]]]);
    add('Z', [[[0.2, 0.05], [0.8, 0.05], [0.2, 0.95], [0.8, 0.95]]]);

    add('a', [[[0.7, 0.2], [0.5, 0.1], [0.3, 0.25], [0.25, 0.5], [0.3, 0.75], [0.5, 0.9], [0.7, 0.8], [0.7, 0.5], [0.5, 0.5]], [[0.7, 0.5], [0.7, 0.9]]]);
    add('b', [[[0.3, 0.05], [0.3, 0.95]], [[0.3, 0.5], [0.5, 0.5], [0.75, 0.65], [0.75, 0.8], [0.5, 0.95], [0.3, 0.95]]]);
    add('c', [[[0.7, 0.4], [0.5, 0.3], [0.3, 0.45], [0.25, 0.65], [0.3, 0.85], [0.5, 0.95], [0.7, 0.85]]]);
    add('d', [[[0.7, 0.05], [0.7, 0.95]], [[0.7, 0.5], [0.5, 0.5], [0.25, 0.65], [0.25, 0.8], [0.5, 0.95], [0.7, 0.95]]]);
    add('e', [[[0.7, 0.55], [0.3, 0.55], [0.25, 0.7], [0.35, 0.88], [0.55, 0.92], [0.7, 0.8], [0.7, 0.6], [0.3, 0.6]]]);
    add('f', [[[0.5, 0.05], [0.5, 0.95]], [[0.35, 0.15], [0.55, 0.05], [0.65, 0.15]], [[0.3, 0.5], [0.6, 0.5]]]);
    add('g', [[[0.7, 0.05], [0.7, 0.7]], [[0.7, 0.05], [0.5, 0.05], [0.3, 0.2], [0.25, 0.45], [0.35, 0.7], [0.55, 0.75], [0.7, 0.7]], [[0.7, 0.7], [0.7, 0.85], [0.55, 0.97], [0.35, 0.92], [0.25, 0.75]]]);
    add('h', [[[0.3, 0.05], [0.3, 0.95]], [[0.3, 0.45], [0.5, 0.45], [0.7, 0.6], [0.7, 0.95]]]);
    add('i', [[[0.5, 0.25], [0.5, 0.95]], [[0.45, 0.08], [0.55, 0.08]]]);
    add('j', [[[0.6, 0.25], [0.6, 0.85], [0.5, 0.97], [0.4, 0.85]], [[0.55, 0.08], [0.65, 0.08]]]);
    add('k', [[[0.3, 0.05], [0.3, 0.95]], [[0.3, 0.5], [0.7, 0.15]], [[0.3, 0.6], [0.7, 0.95]]]);
    add('l', [[[0.5, 0.05], [0.5, 0.95]], [[0.35, 0.05], [0.65, 0.05]]]);
    add('m', [[[0.2, 0.95], [0.2, 0.4], [0.4, 0.55], [0.4, 0.95]], [[0.4, 0.4], [0.6, 0.55], [0.6, 0.95]], [[0.6, 0.4], [0.8, 0.55], [0.8, 0.95]]]);
    add('n', [[[0.25, 0.95], [0.25, 0.4]], [[0.25, 0.4], [0.5, 0.55], [0.5, 0.95]]]);
    add('o', [[[0.5, 0.35], [0.3, 0.45], [0.25, 0.65], [0.3, 0.85], [0.5, 0.95], [0.7, 0.85], [0.75, 0.65], [0.7, 0.45], [0.5, 0.35]]]);
    add('p', [[[0.3, 0.05], [0.3, 0.95]], [[0.3, 0.5], [0.5, 0.5], [0.75, 0.65], [0.75, 0.8], [0.5, 0.95], [0.3, 0.95]]]);
    add('q', [[[0.7, 0.05], [0.7, 0.95]], [[0.7, 0.5], [0.5, 0.5], [0.25, 0.65], [0.25, 0.8], [0.5, 0.95], [0.7, 0.95]]]);
    add('r', [[[0.3, 0.95], [0.3, 0.4]], [[0.3, 0.4], [0.45, 0.4], [0.6, 0.5]]]);
    add('s', [[[0.7, 0.4], [0.5, 0.35], [0.3, 0.45], [0.3, 0.6], [0.5, 0.67], [0.7, 0.75], [0.7, 0.9], [0.5, 0.97], [0.3, 0.9]]]);
    add('t', [[[0.5, 0.05], [0.5, 0.95]], [[0.25, 0.25], [0.75, 0.25]]]);
    add('u', [[[0.25, 0.4], [0.25, 0.8], [0.4, 0.95], [0.6, 0.95], [0.75, 0.8], [0.75, 0.4]]]);
    add('v', [[[0.2, 0.4], [0.5, 0.95], [0.8, 0.4]]]);
    add('w', [[[0.2, 0.4], [0.3, 0.95], [0.45, 0.6], [0.55, 0.95], [0.7, 0.6], [0.8, 0.95]]]);
    add('x', [[[0.2, 0.4], [0.8, 0.95]], [[0.8, 0.4], [0.2, 0.95]]]);
    add('y', [[[0.2, 0.4], [0.5, 0.85], [0.8, 0.4]], [[0.5, 0.85], [0.4, 0.97], [0.25, 0.85]]]);
    add('z', [[[0.2, 0.4], [0.8, 0.4], [0.2, 0.95], [0.8, 0.95]]]);

    add('0', [[[0.5, 0.1], [0.25, 0.25], [0.2, 0.5], [0.25, 0.75], [0.5, 0.9], [0.75, 0.75], [0.8, 0.5], [0.75, 0.25], [0.5, 0.1]]]);
    add('1', [[[0.5, 0.15], [0.5, 0.9]], [[0.3, 0.2], [0.5, 0.05]]]);
    add('2', [[[0.25, 0.2], [0.4, 0.05], [0.6, 0.05], [0.75, 0.25], [0.5, 0.5], [0.3, 0.7], [0.3, 0.9], [0.75, 0.9]]]);
    add('3', [[[0.25, 0.1], [0.5, 0.05], [0.7, 0.2], [0.7, 0.4], [0.55, 0.5], [0.7, 0.6], [0.7, 0.8], [0.5, 0.95], [0.25, 0.85]]]);
    add('4', [[[0.6, 0.9], [0.3, 0.9], [0.6, 0.1], [0.6, 0.9]], [[0.2, 0.5], [0.75, 0.5]]]);
    add('5', [[[0.7, 0.05], [0.3, 0.05], [0.3, 0.45], [0.55, 0.45], [0.75, 0.55], [0.75, 0.75], [0.55, 0.95], [0.3, 0.9], [0.25, 0.7]]]);
    add('6', [[[0.7, 0.1], [0.5, 0.05], [0.25, 0.25], [0.2, 0.5], [0.25, 0.75], [0.45, 0.95], [0.65, 0.9], [0.75, 0.7], [0.7, 0.55], [0.5, 0.5], [0.3, 0.6]]]);
    add('7', [[[0.2, 0.05], [0.8, 0.05], [0.4, 0.95]]]);
    add('8', [[[0.5, 0.05], [0.3, 0.2], [0.25, 0.4], [0.35, 0.5], [0.25, 0.6], [0.3, 0.8], [0.5, 0.95], [0.7, 0.8], [0.75, 0.6], [0.65, 0.5], [0.75, 0.4], [0.7, 0.2], [0.5, 0.05]]]);
    add('9', [[[0.3, 0.85], [0.5, 0.95], [0.7, 0.85], [0.75, 0.65], [0.7, 0.45], [0.5, 0.35], [0.3, 0.45], [0.25, 0.6]]]);

    add('.', [[[0.48, 0.85], [0.52, 0.88], [0.48, 0.92], [0.52, 0.88]]]);
    add(',', [[[0.5, 0.7], [0.45, 0.9], [0.38, 0.88]]]);
    add('?', [[[0.25, 0.2], [0.5, 0.05], [0.7, 0.2], [0.6, 0.4], [0.5, 0.5]], [[0.5, 0.75], [0.5, 0.8]]]);
    add('!', [[[0.5, 0.05], [0.5, 0.7]], [[0.48, 0.85], [0.52, 0.88]]]);
    add(';', [[[0.5, 0.3], [0.45, 0.45], [0.38, 0.42]], [[0.5, 0.7], [0.45, 0.9], [0.38, 0.88]]]);
    add(':', [[[0.48, 0.28], [0.52, 0.32]], [[0.48, 0.7], [0.52, 0.74]]]);
    add('-', [[[0.25, 0.5], [0.75, 0.5]]]);
    add('+', [[[0.5, 0.15], [0.5, 0.85]], [[0.15, 0.5], [0.85, 0.5]]]);
    add('=', [[[0.2, 0.38], [0.8, 0.38]], [[0.2, 0.62], [0.8, 0.62]]]);
    add("'", [[[0.45, 0.1], [0.5, 0.3]]]);
    add('"', [[[0.3, 0.1], [0.35, 0.3]], [[0.65, 0.1], [0.7, 0.3]]]);
    add('(', [[[0.7, 0.1], [0.4, 0.3], [0.3, 0.5], [0.4, 0.7], [0.7, 0.9]]]);
    add(')', [[[0.3, 0.1], [0.6, 0.3], [0.7, 0.5], [0.6, 0.7], [0.3, 0.9]]]);
    add('/', [[[0.75, 0.05], [0.25, 0.95]]]);
    add('\\', [[[0.25, 0.05], [0.75, 0.95]]]);
    add('@', [[[0.65, 0.4], [0.5, 0.3], [0.3, 0.4], [0.25, 0.6], [0.35, 0.85], [0.55, 0.9], [0.7, 0.75], [0.7, 0.5], [0.55, 0.4], [0.45, 0.5], [0.45, 0.7], [0.55, 0.8], [0.75, 0.5]]]);
    add('#', [[[0.25, 0.1], [0.25, 0.9]], [[0.75, 0.1], [0.75, 0.9]], [[0.1, 0.35], [0.9, 0.35]], [[0.1, 0.65], [0.9, 0.65]]]);
    add('&', [[[0.25, 0.1], [0.5, 0.15], [0.65, 0.3], [0.5, 0.5], [0.3, 0.65], [0.5, 0.8], [0.75, 0.9]]]);
    add('*', [[[0.5, 0.1], [0.5, 0.9]], [[0.15, 0.3], [0.85, 0.7]], [[0.85, 0.3], [0.15, 0.7]]]);
    add('%', [[[0.2, 0.1], [0.8, 0.9]], [[0.3, 0.2], [0.2, 0.3], [0.3, 0.3], [0.3, 0.2]], [[0.7, 0.7], [0.8, 0.8], [0.7, 0.8], [0.7, 0.7]]]);
    add(' ', []);

    return t;
  }

  private normalizeStrokes(strokes: Stroke[]): Point[][] {
    const allPoints: Point[] = [];
    for (const s of strokes) {
      for (const p of s.points) {
        allPoints.push(p);
      }
    }

    if (allPoints.length === 0) return strokes.map(() => []);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of allPoints) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const w = Math.max(maxX - minX, 1);
    const h = Math.max(maxY - minY, 1);
    const maxDim = Math.max(w, h);
    const scale = 1 / maxDim;
    const offX = (1 - w * scale) / 2;
    const offY = (1 - h * scale) / 2;

    return strokes.map(s =>
      s.points.map(p => ({
        x: (p.x - minX) * scale + offX,
        y: (p.y - minY) * scale + offY,
        pressure: p.pressure,
        timestamp: p.timestamp,
      })),
    );
  }

  private resamplePoints(points: Point[], count: number): Point[] {
    if (points.length < 2) return points;

    let totalLen = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLen += Math.sqrt(dx * dx + dy * dy);
    }
    if (totalLen === 0) return [points[0]];

    const step = totalLen / (count - 1);
    const result: Point[] = [points[0]];
    let currentDist = 0;
    let prev = points[0];

    for (let i = 1; i < points.length && result.length < count; i++) {
      const cur = points[i];
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);

      if (segLen === 0) continue;

      while (currentDist + segLen >= step && result.length < count) {
        const t = (step - currentDist) / segLen;
        result.push({
          x: prev.x + dx * t,
          y: prev.y + dy * t,
          pressure: prev.pressure + (cur.pressure - prev.pressure) * t,
          timestamp: prev.timestamp + (cur.timestamp - prev.timestamp) * t,
        });
        prev = { ...result[result.length - 1] };
        currentDist = 0;
        const nDx = cur.x - prev.x;
        const nDy = cur.y - prev.y;
        const remainingAfter = Math.sqrt(nDx * nDx + nDy * nDy);
        if (remainingAfter < 1e-6) break;
        const scaledDx = dx / segLen * remainingAfter;
        const scaledDy = dy / segLen * remainingAfter;
        void scaledDx; void scaledDy;
      }

      const dx1 = cur.x - prev.x;
      const dy1 = cur.y - prev.y;
      currentDist += Math.sqrt(dx1 * dx1 + dy1 * dy1);
      prev = cur;
    }

    while (result.length < count) {
      result.push({ ...points[points.length - 1] });
    }

    return result;
  }

  private templatePoints(tpl: number[][][]): Point[][] {
    return tpl.map(stroke => {
      const pts: Point[] = stroke.map(([x, y]) => ({
        x, y, pressure: 0.5, timestamp: 0,
      }));
      return this.resamplePoints(pts, this.NUM_SAMPLES);
    });
  }

  private strokeDistance(a: Point[], b: Point[]): number {
    if (a.length === 0 || b.length === 0) return 1;
    const n = Math.min(a.length, b.length);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const dx = a[i].x - b[i].x;
      const dy = a[i].y - b[i].y;
      sum += Math.sqrt(dx * dx + dy * dy);
    }
    return sum / n;
  }

  private compareWithTemplate(
    normStrokes: Point[][],
    tplStrokes: Point[][],
  ): number {
    if (tplStrokes.length === 0) {
      return normStrokes.length === 0 ? 0.3 : 0.05;
    }

    const n1 = normStrokes.length;
    const n2 = tplStrokes.length;

    if (n1 === 0) return 0.1;

    const maxDiff = Math.abs(n1 - n2);
    const strokePenalty = Math.min(1, maxDiff * 0.12);

    const usedA = new Set<number>();
    const usedB = new Set<number>();
    let totalDist = 0;
    let matched = 0;

    const pairs: Array<{ a: number; b: number; d: number }> = [];
    for (let i = 0; i < n1; i++) {
      for (let j = 0; j < n2; j++) {
        const d = this.strokeDistance(
          this.resamplePoints(normStrokes[i], this.NUM_SAMPLES),
          tplStrokes[j],
        );
        pairs.push({ a: i, b: j, d });
      }
    }
    pairs.sort((x, y) => x.d - y.d);

    for (const p of pairs) {
      if (usedA.has(p.a) || usedB.has(p.b)) continue;
      usedA.add(p.a);
      usedB.add(p.b);
      totalDist += p.d;
      matched++;
      if (matched === Math.min(n1, n2)) break;
    }

    const avgMatchDist = matched > 0 ? totalDist / matched : 0.5;
    const unmatchedPenalty = (n1 + n2 - 2 * matched) * 0.05;
    const similarity = 1 - Math.min(1, avgMatchDist * 2 + strokePenalty + unmatchedPenalty);
    return Math.max(0, similarity);
  }

  public recognize(segment: CharacterSegment): void {
    const start = performance.now();

    setTimeout(() => {
      if (segment.strokes.length === 0 ||
          segment.strokes.every(s => s.points.length < 2)) {
        this.events.onRecognitionResult(segment.id, [], '');
        return;
      }

      const normStrokes = this.normalizeStrokes(segment.strokes);

      const scored: Array<{ char: string; score: number }> = [];
      const tplCache = new Map<string, Point[][]>();

      for (const tpl of this.templates) {
        let tplPts = tplCache.get(tpl.char);
        if (!tplPts) {
          tplPts = this.templatePoints(tpl.strokes);
          tplCache.set(tpl.char, tplPts);
        }
        const score = this.compareWithTemplate(normStrokes, tplPts);
        if (score > 0.08) {
          scored.push({ char: tpl.char, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);

      const finalCandidates: Candidate[] = [];
      const seen = new Set<string>();
      for (const s of scored) {
        if (seen.has(s.char)) continue;
        seen.add(s.char);
        const confidence = Math.max(0, Math.min(1, (s.score - 0.15) / 0.6));
        if (confidence >= 0.6 && finalCandidates.length < 3) {
          finalCandidates.push({ char: s.char, confidence });
        }
        if (finalCandidates.length >= 3) break;
      }

      let bestChar = '';
      if (finalCandidates.length > 0) {
        bestChar = finalCandidates[0].char;
      } else if (scored.length > 0) {
        const lowConf = Math.max(0, Math.min(1, (scored[0].score - 0.15) / 0.6));
        bestChar = scored[0].char;
        if (lowConf >= 0.3) {
          finalCandidates.push({ char: scored[0].char, confidence: lowConf });
        }
      }

      const elapsed = performance.now() - start;
      if (elapsed > 180) {
        setTimeout(() => {
          this.events.onRecognitionResult(segment.id, finalCandidates, bestChar);
        }, Math.max(0, 200 - elapsed));
      } else {
        this.events.onRecognitionResult(segment.id, finalCandidates, bestChar);
      }
    }, 0);
  }
}
