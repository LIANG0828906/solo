import type { FormulaItem, ScentCard, MixResult } from '../types';

export function recalcRatios(formula: FormulaItem[]): FormulaItem[] {
  if (formula.length === 0) return [];
  const ratio = Number((100 / formula.length).toFixed(2));
  return formula.map((item, idx) => ({
    ...item,
    ratio: idx === formula.length - 1
      ? Number((100 - ratio * (formula.length - 1)).toFixed(2))
      : ratio,
  }));
}

export function buildFormulaItem(scent: ScentCard, instanceId: string): FormulaItem {
  return {
    id: instanceId,
    scentId: scent.id,
    type: scent.type,
    name: scent.name,
    color: scent.color,
    liquidColor: scent.liquidColor,
    ratio: 0,
  };
}

export function generateGradient(formula: FormulaItem[]): string {
  if (formula.length === 0) {
    return 'linear-gradient(180deg, #E8E8E8 0%, #D0D0D0 100%)';
  }
  if (formula.length === 1) {
    const c = formula[0].liquidColor;
    return `linear-gradient(180deg, ${c}FF 0%, ${c}CC 50%, ${c}99 100%)`;
  }
  const colors = formula.map(f => f.liquidColor);
  const stops = colors.map((c, i) => {
    const pct = Math.round((i / (colors.length - 1)) * 100);
    return `${c} ${pct}%`;
  });
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

export function getGradientColors(formula: FormulaItem[]): string[] {
  return formula.map(f => f.liquidColor);
}

export function getDominantColor(formula: FormulaItem[]): string {
  if (formula.length === 0) return '#CCCCCC';
  const sorted = [...formula].sort((a, b) => b.ratio - a.ratio);
  return sorted[0].liquidColor;
}

export function getTotalRatio(formula: FormulaItem[]): number {
  return formula.reduce((sum, f) => 0, 100);
}

export function computeMix(formula: FormulaItem[]): MixResult {
  const recalculated = recalcRatios(formula);
  return {
    formula: recalculated,
    totalRatio: recalculated.length > 0 ? 100 : 0,
    gradient: generateGradient(recalculated),
    dominantColor: getDominantColor(recalculated),
  };
}

export function buildTotalGradient(formula: FormulaItem[]): string {
  if (formula.length === 0) {
    return '#E8E8E8';
  }
  const colors = formula.map(f => f.liquidColor);
  return `linear-gradient(90deg, ${colors.join(', ')})`;
}
