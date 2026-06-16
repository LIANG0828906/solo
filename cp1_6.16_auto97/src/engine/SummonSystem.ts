import type {
  PathPoint,
  SummonPattern,
  SummonResult,
  Spirit,
  ElementType,
  Skill,
  Rarity,
} from './types';

const SAMPLE_COUNT = 64;
const SIMILARITY_THRESHOLD = 0.7;
const MAX_RESPONSE_TIME = 1500;

export class SummonSystem {
  private patterns: SummonPattern[];

  constructor() {
    this.patterns = this.createDefaultPatterns();
  }

  private createDefaultPatterns(): SummonPattern[] {
    return [
      this.createFirePattern(),
      this.createWaterPattern(),
      this.createWoodPattern(),
      this.createLightPattern(),
      this.createDarkPattern(),
    ];
  }

  private createFirePattern(): SummonPattern {
    const points: PathPoint[] = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const r = 0.5 + 0.3 * Math.sin(angle * 3);
      points.push({
        x: Math.cos(angle) * r * 0.8,
        y: Math.sin(angle) * r * 0.8,
      });
    }
    return {
      id: 'fire-001',
      name: '炎之纹路',
      element: 'fire',
      points,
      spiritTemplate: {
        name: '炎灵',
        element: 'fire',
        rarity: 2,
        maxHp: 100,
        attack: 25,
        defense: 10,
        speed: 18,
        maxEnergy: 100,
        description: '掌控火焰的精灵，擅长高伤害输出。',
        color: '#FF5722',
      },
    };
  }

  private createWaterPattern(): SummonPattern {
    const points: PathPoint[] = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const r = 0.6 + 0.2 * Math.cos(angle * 2);
      points.push({
        x: Math.cos(angle) * r * 0.7,
        y: Math.sin(angle) * r * 0.9,
      });
    }
    return {
      id: 'water-001',
      name: '水之纹路',
      element: 'water',
      points,
      spiritTemplate: {
        name: '水灵',
        element: 'water',
        rarity: 2,
        maxHp: 120,
        attack: 18,
        defense: 15,
        speed: 15,
        maxEnergy: 100,
        description: '流动的水之精灵，攻守兼备。',
        color: '#2196F3',
      },
    };
  }

  private createWoodPattern(): SummonPattern {
    const points: PathPoint[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const r = 0.5 + 0.25 * Math.sin(angle * 5);
      points.push({
        x: Math.cos(angle) * r * 0.75,
        y: Math.sin(angle) * r * 0.75,
      });
    }
    return {
      id: 'wood-001',
      name: '木之纹路',
      element: 'wood',
      points,
      spiritTemplate: {
        name: '木灵',
        element: 'wood',
        rarity: 2,
        maxHp: 130,
        attack: 15,
        defense: 18,
        speed: 12,
        maxEnergy: 100,
        description: '自然的守护精灵，拥有强大的生命力。',
        color: '#4CAF50',
      },
    };
  }

  private createLightPattern(): SummonPattern {
    const points: PathPoint[] = [];
    const rays = 6;
    const innerR = 0.3;
    const outerR = 0.7;
    for (let i = 0; i < rays * 2; i++) {
      const angle = (i / (rays * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return {
      id: 'light-001',
      name: '光之纹路',
      element: 'light',
      points,
      spiritTemplate: {
        name: '光灵',
        element: 'light',
        rarity: 3,
        maxHp: 90,
        attack: 28,
        defense: 12,
        speed: 22,
        maxEnergy: 100,
        description: '圣洁的光之精灵，速度极快。',
        color: '#FFC107',
      },
    };
  }

  private createDarkPattern(): SummonPattern {
    const points: PathPoint[] = [];
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const r = 0.4 + 0.3 * Math.sin(angle * 4) * Math.cos(angle * 2);
      points.push({
        x: Math.cos(angle) * r * 0.8,
        y: Math.sin(angle) * r * 0.8,
      });
    }
    return {
      id: 'dark-001',
      name: '暗之纹路',
      element: 'dark',
      points,
      spiritTemplate: {
        name: '暗灵',
        element: 'dark',
        rarity: 3,
        maxHp: 95,
        attack: 30,
        defense: 8,
        speed: 20,
        maxEnergy: 100,
        description: '神秘的暗影精灵，攻击力惊人。',
        color: '#9C27B0',
      },
    };
  }

  public summon(drawnPath: PathPoint[]): SummonResult {
    const startTime = performance.now();

    if (drawnPath.length < 5) {
      return {
        success: false,
        similarity: 0,
        message: '绘制路径太短，请绘制完整的纹路。',
      };
    }

    const normalizedPath = this.normalizePath(drawnPath);

    let bestMatch: SummonPattern | null = null;
    let bestSimilarity = 0;

    for (const pattern of this.patterns) {
      const normalizedPattern = this.normalizePath(pattern.points);
      const similarity = this.calculateSimilarity(normalizedPath, normalizedPattern);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = pattern;
      }
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > MAX_RESPONSE_TIME) {
      console.warn(`召唤识别耗时 ${elapsed.toFixed(0)}ms，超过预期 ${MAX_RESPONSE_TIME}ms`);
    }

    if (bestSimilarity >= SIMILARITY_THRESHOLD && bestMatch) {
      const spirit = this.createSpiritFromTemplate(bestMatch);
      return {
        success: true,
        similarity: bestSimilarity,
        spirit,
        matchedPattern: bestMatch,
        message: `召唤成功！获得${bestMatch.spiritTemplate.name}！`,
      };
    }

    return {
      success: false,
      similarity: bestSimilarity,
      message: bestMatch
        ? `召唤失败，与${bestMatch.name}相似度仅为${(bestSimilarity * 100).toFixed(1)}%，需要70%以上。`
        : '召唤失败，无法识别纹路。',
    };
  }

  public normalizePath(points: PathPoint[]): PathPoint[] {
    let result = this.translateToCenter(points);
    result = this.scaleToUnit(result);
    result = this.resamplePath(result, SAMPLE_COUNT);
    result = this.rotateToPrincipalAxis(result);
    return result;
  }

  private translateToCenter(points: PathPoint[]): PathPoint[] {
    if (points.length === 0) return [];

    let sumX = 0;
    let sumY = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
    }
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    return points.map((p) => ({
      x: p.x - centerX,
      y: p.y - centerY,
    }));
  }

  private scaleToUnit(points: PathPoint[]): PathPoint[] {
    if (points.length === 0) return [];

    let maxDist = 0;
    for (const p of points) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      if (dist > maxDist) {
        maxDist = dist;
      }
    }

    if (maxDist === 0) return points;

    return points.map((p) => ({
      x: p.x / maxDist,
      y: p.y / maxDist,
    }));
  }

  private resamplePath(points: PathPoint[], targetCount: number): PathPoint[] {
    if (points.length < 2) return [...points];

    const totalLength = this.getPathLength(points);
    if (totalLength === 0) return Array(targetCount).fill({ ...points[0] });

    const interval = totalLength / (targetCount - 1);
    const result: PathPoint[] = [];
    let currentDist = 0;

    result.push({ ...points[0] });

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const segLength = Math.hypot(curr.x - prev.x, curr.y - prev.y);

      if (segLength === 0) continue;

      while (currentDist + segLength >= interval && result.length < targetCount) {
        const t = (interval - currentDist) / segLength;
        result.push({
          x: prev.x + t * (curr.x - prev.x),
          y: prev.y + t * (curr.y - prev.y),
        });
        currentDist = 0;
        const remaining = segLength - (interval - currentDist);
        currentDist = remaining;
        break;
      }

      if (result.length < targetCount) {
        currentDist += segLength;
      }
    }

    while (result.length < targetCount) {
      result.push({ ...points[points.length - 1] });
    }

    return result;
  }

  private getPathLength(points: PathPoint[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
    }
    return length;
  }

  private rotateToPrincipalAxis(points: PathPoint[]): PathPoint[] {
    if (points.length < 2) return [...points];

    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;

    for (const p of points) {
      sumXX += p.x * p.x;
      sumYY += p.y * p.y;
      sumXY += p.x * p.y;
    }

    const n = points.length;
    const covXX = sumXX / n;
    const covYY = sumYY / n;
    const covXY = sumXY / n;

    const trace = covXX + covYY;
    const det = covXX * covYY - covXY * covXY;
    const discriminant = Math.sqrt(trace * trace - 4 * det);

    const lambda1 = (trace + discriminant) / 2;

    let angle: number;
    if (Math.abs(covXY) < 1e-10) {
      angle = 0;
    } else {
      const eigenX = lambda1 - covYY;
      const eigenY = covXY;
      angle = Math.atan2(eigenY, eigenX);
    }

    return this.rotatePath(points, -angle);
  }

  private rotatePath(points: PathPoint[], angle: number): PathPoint[] {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return points.map((p) => ({
      x: p.x * cos - p.y * sin,
      y: p.x * sin + p.y * cos,
    }));
  }

  private calculateSimilarity(
    path1: PathPoint[],
    path2: PathPoint[]
  ): number {
    if (path1.length === 0 || path2.length === 0) return 0;

    const n = Math.min(path1.length, path2.length);
    let totalDist = 0;

    for (let i = 0; i < n; i++) {
      const dx = path1[i].x - path2[i].x;
      const dy = path1[i].y - path2[i].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    const avgDist = totalDist / n;

    const maxDist = 2;
    const similarity = Math.max(0, 1 - avgDist / maxDist);

    const reversedPath2 = [...path2].reverse();
    let reversedTotalDist = 0;
    for (let i = 0; i < n; i++) {
      const dx = path1[i].x - reversedPath2[i].x;
      const dy = path1[i].y - reversedPath2[i].y;
      reversedTotalDist += Math.sqrt(dx * dx + dy * dy);
    }
    const reversedAvgDist = reversedTotalDist / n;
    const reversedSimilarity = Math.max(0, 1 - reversedAvgDist / maxDist);

    return Math.max(similarity, reversedSimilarity);
  }

  private createSpiritFromTemplate(pattern: SummonPattern): Spirit {
    const template = pattern.spiritTemplate;
    const skills = this.createSkillsForElement(template.element, template.rarity);

    return {
      id: `spirit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      element: template.element,
      rarity: template.rarity,
      maxHp: template.maxHp,
      currentHp: template.maxHp,
      attack: template.attack,
      defense: template.defense,
      speed: template.speed,
      maxEnergy: template.maxEnergy,
      currentEnergy: 0,
      skills,
      description: template.description,
      level: 1,
      exp: 0,
      color: template.color,
      isDefending: false,
      defenseBonus: 0,
    };
  }

  private createSkillsForElement(element: ElementType, rarity: Rarity): Skill[] {
    const skills: Skill[] = [];
    const multiplier = 1 + (rarity - 1) * 0.2;

    const normalSkill: Skill = {
      id: `skill-${element}-normal`,
      name: this.getSkillName(element, 'normal'),
      type: 'normal',
      damage: Math.floor(10 * multiplier),
      energyCost: 0,
      cooldown: 0,
      currentCooldown: 0,
    };
    skills.push(normalSkill);

    const powerSkill: Skill = {
      id: `skill-${element}-power`,
      name: this.getSkillName(element, 'power'),
      type: 'power',
      damage: Math.floor(25 * multiplier),
      energyCost: 30,
      cooldown: 2,
      currentCooldown: 0,
    };
    skills.push(powerSkill);

    const defenseSkill: Skill = {
      id: `skill-${element}-defense`,
      name: this.getSkillName(element, 'defense'),
      type: 'defense',
      damage: 0,
      energyCost: 20,
      cooldown: 3,
      currentCooldown: 0,
      defenseBonus: Math.floor(15 * multiplier),
    };
    skills.push(defenseSkill);

    return skills;
  }

  private getSkillName(element: ElementType, type: 'normal' | 'power' | 'defense'): string {
    const names: Record<ElementType, Record<string, string>> = {
      fire: {
        normal: '火花',
        power: '烈焰冲击',
        defense: '火焰护盾',
      },
      water: {
        normal: '水弹',
        power: '海啸之力',
        defense: '水之屏障',
      },
      wood: {
        normal: '藤蔓抽打',
        power: '自然之怒',
        defense: '森林守护',
      },
      light: {
        normal: '圣光弹',
        power: '神圣审判',
        defense: '光明护盾',
      },
      dark: {
        normal: '暗影刺',
        power: '暗影爆发',
        defense: '黑暗庇护',
      },
    };

    return names[element][type];
  }

  public getPatterns(): SummonPattern[] {
    return this.patterns;
  }

  public getPatternByElement(element: ElementType): SummonPattern | undefined {
    return this.patterns.find((p) => p.element === element);
  }
}
