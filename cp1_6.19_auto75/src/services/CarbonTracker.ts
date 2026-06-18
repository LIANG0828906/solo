import { FabricType } from '../types';
import { fabricData } from '../data/clothing';

const BASELINE_CARBON = 8.5;

export class CarbonTracker {
  private static instance: CarbonTracker;
  private listeners: Set<(score: number) => void> = new Set();

  private constructor() {}

  static getInstance(): CarbonTracker {
    if (!CarbonTracker.instance) {
      CarbonTracker.instance = new CarbonTracker();
    }
    return CarbonTracker.instance;
  }

  subscribe(callback: (score: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(score: number): void {
    this.listeners.forEach((cb) => cb(score));
  }

  calculate(fabricType: FabricType, complexity: number, baseScore: number): number {
    const startTime = performance.now();

    const fabric = fabricData[fabricType];
    const fabricFactor = fabric.carbonFactor;
    const complexityFactor = Math.max(0.8, Math.min(2.5, complexity));

    const score = Math.max(
      0,
      Math.min(10, baseScore * fabricFactor * complexityFactor)
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 50) {
      console.warn(`Carbon calculation took ${duration}ms, exceeds 50ms target`);
    }

    this.notify(score);
    return Math.round(score * 10) / 10;
  }

  calculateCarbonSaved(score: number): number {
    return Math.max(0, BASELINE_CARBON - score);
  }

  getCarbonRating(score: number): 1 | 2 | 3 | 4 | 5 {
    if (score <= 2) return 5;
    if (score <= 4) return 4;
    if (score <= 6) return 3;
    if (score <= 8) return 2;
    return 1;
  }

  getRatingDescription(rating: number): string {
    const descriptions: Record<number, string> = {
      1: '高碳足迹，环境影响较大',
      2: '中高碳足迹，有改进空间',
      3: '中等碳足迹，符合行业标准',
      4: '低碳足迹，环保表现优秀',
      5: '极低碳足迹，环保典范'
    };
    return descriptions[rating] || '未知';
  }

  getFabricCarbonImpact(fabricType: FabricType): {
    level: 'low' | 'medium' | 'high';
    description: string;
  } {
    const factor = fabricData[fabricType].carbonFactor;
    if (factor <= 0.8) {
      return {
        level: 'low',
        description: '低碳环保面料，对环境友好'
      };
    } else if (factor <= 1.0) {
      return {
        level: 'medium',
        description: '中碳面料，平衡环保与性能'
      };
    }
    return {
      level: 'high',
      description: '相对较高的环境影响'
    };
  }

  getComplexityImpact(complexity: number): string {
    if (complexity <= 1.0) return '简单剪裁，低碳生产';
    if (complexity <= 1.5) return '中等复杂度，标准生产流程';
    return '复杂工艺，生产能耗较高';
  }
}

export const carbonTracker = CarbonTracker.getInstance();
