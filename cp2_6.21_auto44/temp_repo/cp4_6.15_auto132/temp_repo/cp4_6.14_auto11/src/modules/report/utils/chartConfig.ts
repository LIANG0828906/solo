import type { Objective, KeyResult, Dependency } from '@/types';

export interface RadarDataPoint {
  objective: string;
  完成率: number;
  fullMark: number;
}

export interface StackedBarDataPoint {
  name: string;
  已完成: number;
  未完成: number;
}

export interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

export const FAILURE_REASON_OPTIONS = [
  '资源不足',
  '优先级调整',
  '技术困难',
  '需求变更',
  '人员变动',
  '时间不足',
  '外部依赖',
  '目标设定不合理',
];

export const PIE_COLORS = [
  '#0d9488',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function buildRadarData(
  objectives: Objective[],
  keyResults: KeyResult[]
): RadarDataPoint[] {
  return objectives.map((obj) => {
    const krs = keyResults.filter((kr) => kr.objectiveId === obj.id);
    let totalPct = 0;
    krs.forEach((kr) => {
      if (kr.type === 'numeric') {
        if (kr.targetValue !== kr.initialValue) {
          totalPct += ((kr.currentValue - kr.initialValue) / (kr.targetValue - kr.initialValue)) * 100;
        }
      } else if (kr.type === 'boolean') {
        totalPct += kr.currentValue >= kr.targetValue ? 100 : 0;
      } else {
        totalPct += kr.currentValue;
      }
    });
    const avgPct = krs.length > 0 ? Math.round(totalPct / krs.length) : 0;
    return {
      objective: obj.title.length > 6 ? obj.title.slice(0, 6) + '…' : obj.title,
      完成率: avgPct,
      fullMark: 100,
    };
  });
}

export function buildStackedBarData(
  objectives: Objective[],
  keyResults: KeyResult[]
): StackedBarDataPoint[] {
  return objectives.map((obj) => {
    const krs = keyResults.filter((kr) => kr.objectiveId === obj.id);
    let totalPct = 0;
    krs.forEach((kr) => {
      if (kr.type === 'numeric') {
        if (kr.targetValue !== kr.initialValue) {
          totalPct += ((kr.currentValue - kr.initialValue) / (kr.targetValue - kr.initialValue)) * 100;
        }
      } else if (kr.type === 'boolean') {
        totalPct += kr.currentValue >= kr.targetValue ? 100 : 0;
      } else {
        totalPct += kr.currentValue;
      }
    });
    const avgPct = krs.length > 0 ? Math.round(totalPct / krs.length) : 0;
    return {
      name: obj.title.length > 8 ? obj.title.slice(0, 8) + '…' : obj.title,
      已完成: avgPct,
      未完成: 100 - avgPct,
    };
  });
}

export function buildPieData(
  failureReasons: { keyResultId: string; reasons: string[] }[]
): PieDataPoint[] {
  const reasonCount: Record<string, number> = {};
  failureReasons.forEach((fr) => {
    fr.reasons.forEach((r) => {
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    });
  });
  return Object.entries(reasonCount).map(([name, value], i) => ({
    name,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
}

export function buildDependencyLines(
  dependencies: Dependency[],
  objectives: Objective[],
  containerRef: HTMLDivElement | null
): { id: string; x1: number; y1: number; x2: number; y2: number }[] {
  if (!containerRef) return [];
  const containerRect = containerRef.getBoundingClientRect();
  return dependencies.map((dep) => {
    const srcEl = containerRef.querySelector(`[data-obj-id="${dep.sourceId}"]`);
    const tgtEl = containerRef.querySelector(`[data-obj-id="${dep.targetId}"]`);
    if (!srcEl || !tgtEl) return { id: dep.id, x1: 0, y1: 0, x2: 0, y2: 0 };
    const srcRect = srcEl.getBoundingClientRect();
    const tgtRect = tgtEl.getBoundingClientRect();
    return {
      id: dep.id,
      x1: srcRect.right - containerRect.left,
      y1: srcRect.top + srcRect.height / 2 - containerRect.top,
      x2: tgtRect.left - containerRect.left,
      y2: tgtRect.top + tgtRect.height / 2 - containerRect.top,
    };
  });
}
