import { Stroke } from './InkSimulator';

export interface ScoreResult {
  total: number;
  strokeOrder: number;
  shape: number;
  layout: number;
  stars: number;
}

interface TemplateStroke {
  points: number[][];
  label: string;
}

interface CharacterTemplate {
  char: string;
  strokes: TemplateStroke[];
}

const TEMPLATES: Record<string, CharacterTemplate> = {
  '永': {
    char: '永',
    strokes: [
      {
        label: '点',
        points: [
          [388, 128], [392, 138], [396, 146], [400, 153], [403, 158],
          [406, 163], [408, 167], [409, 170], [408, 173], [405, 176]
        ]
      },
      {
        label: '横竖钩',
        points: [
          [250, 200], [310, 200], [380, 200], [450, 200], [545, 204],
          [490, 250], [445, 310], [420, 370], [408, 430], [385, 480]
        ]
      },
      {
        label: '撇',
        points: [
          [395, 255], [375, 285], [350, 315], [320, 345], [288, 370],
          [258, 395], [232, 415], [212, 432], [198, 444], [188, 452]
        ]
      },
      {
        label: '捺',
        points: [
          [408, 275], [428, 300], [450, 325], [475, 348], [500, 368],
          [525, 386], [545, 400], [560, 412], [570, 422], [575, 430]
        ]
      }
    ]
  },
  '和': {
    char: '和',
    strokes: [
      {
        label: '撇横',
        points: [
          [295, 130], [275, 155], [250, 175], [230, 190], [210, 200],
          [240, 200], [280, 200], [320, 200], [360, 200], [380, 205]
        ]
      },
      {
        label: '竖撇点',
        points: [
          [290, 205], [290, 260], [290, 320], [290, 380], [290, 440],
          [268, 400], [240, 420], [218, 438], [205, 448], [200, 455]
        ]
      },
      {
        label: '口框',
        points: [
          [410, 210], [410, 270], [410, 330], [410, 390], [410, 450],
          [460, 450], [510, 440], [550, 420], [570, 380], [570, 280]
        ]
      },
      {
        label: '口横',
        points: [
          [410, 280], [435, 280], [460, 280], [490, 280], [520, 280],
          [545, 295], [560, 320], [565, 355], [565, 400], [565, 445]
        ]
      }
    ]
  },
  '风': {
    char: '风',
    strokes: [
      {
        label: '撇',
        points: [
          [380, 130], [360, 165], [335, 200], [310, 240], [285, 280],
          [260, 320], [240, 355], [225, 385], [215, 410], [210, 430]
        ]
      },
      {
        label: '横折弯钩',
        points: [
          [380, 130], [420, 130], [460, 132], [500, 136], [540, 142],
          [555, 175], [560, 220], [555, 270], [540, 320], [510, 470]
        ]
      },
      {
        label: '左点',
        points: [
          [340, 260], [330, 285], [322, 310], [318, 335], [320, 360],
          [325, 380], [332, 395], [340, 405], [348, 410], [355, 412]
        ]
      },
      {
        label: '右点',
        points: [
          [440, 240], [450, 268], [456, 296], [458, 324], [456, 352],
          [450, 376], [442, 396], [434, 410], [428, 418], [425, 422]
        ]
      }
    ]
  },
  '雅': {
    char: '雅',
    strokes: [
      {
        label: '横竖折',
        points: [
          [220, 160], [270, 160], [320, 160], [370, 160], [395, 165],
          [395, 210], [395, 260], [395, 310], [395, 360], [340, 365]
        ]
      },
      {
        label: '竖撇',
        points: [
          [310, 165], [310, 220], [310, 280], [310, 340], [310, 400],
          [290, 390], [265, 405], [240, 420], [222, 432], [212, 440]
        ]
      },
      {
        label: '撇点',
        points: [
          [350, 260], [370, 280], [385, 305], [395, 335], [400, 365],
          [425, 350], [445, 335], [460, 320], [468, 305], [470, 295]
        ]
      },
      {
        label: '隹横列',
        points: [
          [440, 170], [470, 170], [510, 170], [550, 170], [580, 175],
          [440, 230], [480, 230], [520, 230], [560, 230], [580, 235],
        ]
      }
    ]
  }
};

export class Scorer {
  private template: CharacterTemplate;

  constructor(char: string) {
    this.template = TEMPLATES[char] || TEMPLATES['永'];
  }

  setCharacter(char: string): void {
    this.template = TEMPLATES[char] || TEMPLATES['永'];
  }

  score(userStrokes: Stroke[]): ScoreResult {
    const startTime = performance.now();

    if (userStrokes.length === 0) {
      return { total: 0, strokeOrder: 0, shape: 0, layout: 0, stars: 1 };
    }

    const orderScore = this.calcStrokeOrderScore(userStrokes);
    const shapeScore = this.calcShapeScore(userStrokes);
    const layoutScore = this.calcLayoutScore(userStrokes);

    const total = Math.round(
      orderScore * 0.4 + shapeScore * 0.4 + layoutScore * 0.2
    );

    const elapsed = performance.now() - startTime;
    if (elapsed > 500) {
      console.warn(`Scoring took ${elapsed.toFixed(1)}ms (target: <500ms)`);
    }

    return {
      total: Math.min(100, Math.max(0, total)),
      strokeOrder: Math.min(100, Math.max(0, Math.round(orderScore))),
      shape: Math.min(100, Math.max(0, Math.round(shapeScore))),
      layout: Math.min(100, Math.max(0, Math.round(layoutScore))),
      stars: this.getStarRating(total)
    };
  }

  private calcStrokeOrderScore(userStrokes: Stroke[]): number {
    const templateStrokes = this.template.strokes;
    if (userStrokes.length === 0 || templateStrokes.length === 0) return 0;

    const matchedIndices = this.matchStrokesToTemplate(userStrokes);

    let orderCorrect = 0;
    let totalPairs = 0;
    for (let i = 0; i < matchedIndices.length; i++) {
      for (let j = i + 1; j < matchedIndices.length; j++) {
        totalPairs++;
        if (matchedIndices[i] < matchedIndices[j]) {
          orderCorrect++;
        }
      }
    }

    if (totalPairs === 0) return 50;

    const orderRatio = orderCorrect / totalPairs;

    const countDiff = Math.abs(userStrokes.length - templateStrokes.length);
    const countPenalty = Math.min(countDiff * 10, 30);

    return Math.max(0, orderRatio * 100 - countPenalty);
  }

  private calcShapeScore(userStrokes: Stroke[]): number {
    const templateStrokes = this.template.strokes;
    if (userStrokes.length === 0) return 0;

    const matchedIndices = this.matchStrokesToTemplate(userStrokes);
    let totalDist = 0;
    let matchCount = 0;

    for (let i = 0; i < matchedIndices.length; i++) {
      const tIdx = matchedIndices[i];
      const userNorm = this.normalizeStroke(userStrokes[i]);
      const tmplNorm = this.normalizeTemplateStroke(templateStrokes[tIdx]);

      if (userNorm.length < 2 || tmplNorm.length < 2) continue;

      const dist = this.dtw(userNorm, tmplNorm);
      totalDist += dist;
      matchCount++;
    }

    if (matchCount === 0) return 0;

    const avgDist = totalDist / matchCount;
    const score = Math.max(0, 100 - avgDist * 2);
    return score;
  }

  private calcLayoutScore(userStrokes: Stroke[]): number {
    const templateStrokes = this.template.strokes;
    if (userStrokes.length === 0) return 0;

    const userBBox = this.getUserBBox(userStrokes);
    const tmplBBox = this.getTemplateBBox(templateStrokes);

    if (userBBox.width < 5 || userBBox.height < 5) return 0;

    const centerDist = Math.sqrt(
      Math.pow(userBBox.cx - tmplBBox.cx, 2) +
      Math.pow(userBBox.cy - tmplBBox.cy, 2)
    );
    const maxCenterDist = Math.sqrt(800 * 800 + 600 * 600) / 2;
    const centerScore = Math.max(0, 1 - centerDist / maxCenterDist) * 40;

    const sizeRatio = Math.min(
      (userBBox.width * userBBox.height) /
      Math.max(tmplBBox.width * tmplBBox.height, 1),
      Math.max(tmplBBox.width * tmplBBox.height, 1) /
      (userBBox.width * userBBox.height)
    );
    const sizeScore = Math.min(sizeRatio, 1) * 30;

    const userAspect = userBBox.width / Math.max(userBBox.height, 1);
    const tmplAspect = tmplBBox.width / Math.max(tmplBBox.height, 1);
    const aspectRatio = Math.min(userAspect / Math.max(tmplAspect, 0.01), tmplAspect / Math.max(userAspect, 0.01));
    const aspectScore = Math.min(aspectRatio, 1) * 30;

    return centerScore + sizeScore + aspectScore;
  }

  private matchStrokesToTemplate(userStrokes: Stroke[]): number[] {
    const templateStrokes = this.template.strokes;
    const result: number[] = [];
    const usedTemplates = new Set<number>();

    for (let i = 0; i < userStrokes.length; i++) {
      const userNorm = this.normalizeStroke(userStrokes[i]);
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let j = 0; j < templateStrokes.length; j++) {
        if (usedTemplates.has(j) && usedTemplates.size < templateStrokes.length) continue;
        const tmplNorm = this.normalizeTemplateStroke(templateStrokes[j]);
        if (userNorm.length < 2 || tmplNorm.length < 2) continue;

        const userCentroid = this.getCentroid(userNorm);
        const tmplCentroid = this.getCentroid(tmplNorm);
        const centroidDist = Math.sqrt(
          Math.pow(userCentroid[0] - tmplCentroid[0], 2) +
          Math.pow(userCentroid[1] - tmplCentroid[1], 2)
        );

        if (centroidDist < bestDist) {
          bestDist = centroidDist;
          bestIdx = j;
        }
      }

      result.push(bestIdx);
      usedTemplates.add(bestIdx);
    }

    return result;
  }

  private normalizeStroke(stroke: Stroke): number[][] {
    const points = stroke.points;
    if (points.length < 2) return [];

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = Math.max(maxX - minX, 1);
    const rangeY = Math.max(maxY - minY, 1);
    const range = Math.max(rangeX, rangeY);

    const step = Math.max(1, Math.floor(points.length / 20));
    const result: number[][] = [];
    for (let i = 0; i < points.length; i += step) {
      result.push([
        (points[i].x - minX) / range,
        (points[i].y - minY) / range
      ]);
    }
    return result;
  }

  private normalizeTemplateStroke(tmpl: TemplateStroke): number[][] {
    const points = tmpl.points;
    if (points.length < 2) return [];

    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = Math.max(maxX - minX, 1);
    const rangeY = Math.max(maxY - minY, 1);
    const range = Math.max(rangeX, rangeY);

    return points.map(p => [
      (p[0] - minX) / range,
      (p[1] - minY) / range
    ]);
  }

  private dtw(seq1: number[][], seq2: number[][]): number {
    const n = seq1.length;
    const m = seq2.length;
    if (n === 0 || m === 0) return 100;

    const dp: number[][] = [];
    for (let i = 0; i <= n; i++) {
      dp[i] = new Array(m + 1).fill(Infinity);
    }
    dp[0][0] = 0;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = this.pointDist(seq1[i - 1], seq2[j - 1]);
        dp[i][j] = cost + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        );
      }
    }

    return dp[n][m] / Math.max(n, m);
  }

  private pointDist(a: number[], b: number[]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getCentroid(points: number[][]): number[] {
    let sx = 0, sy = 0;
    for (const p of points) {
      sx += p[0];
      sy += p[1];
    }
    return [sx / points.length, sy / points.length];
  }

  private getUserBBox(strokes: Stroke[]): { cx: number; cy: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const stroke of strokes) {
      for (const p of stroke.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }
    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private getTemplateBBox(strokes: TemplateStroke[]): { cx: number; cy: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const stroke of strokes) {
      for (const p of stroke.points) {
        minX = Math.min(minX, p[0]);
        minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]);
        maxY = Math.max(maxY, p[1]);
      }
    }
    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private getStarRating(score: number): number {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
  }
}
