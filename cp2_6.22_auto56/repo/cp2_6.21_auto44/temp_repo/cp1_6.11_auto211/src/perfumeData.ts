export interface Perfume {
  id: string;
  name: string;
  color: string;
  volatilizeRate: number;
  particleColor: string;
}

export interface FormulaItem {
  perfumeId: string;
  grams: number;
}

export interface SavedFormula {
  id: string;
  name: string;
  items: FormulaItem[];
  totalGrams: number;
  score: number;
  timestamp: number;
}

export const PERFUMES: Perfume[] = [
  { id: 'tan',   name: '檀香', color: '#C19A6B', volatilizeRate: 0.35, particleColor: '#C19A6B' },
  { id: 'long',  name: '龙脑', color: '#F0E68C', volatilizeRate: 0.85, particleColor: '#F0E68C' },
  { id: 'chen',  name: '沉香', color: '#4A3728', volatilizeRate: 0.25, particleColor: '#5C4636' },
  { id: 'ru',    name: '乳香', color: '#F5DEB3', volatilizeRate: 0.55, particleColor: '#F5DEB3' },
  { id: 'huo',   name: '藿香', color: '#8B5A2B', volatilizeRate: 0.65, particleColor: '#A07040' },
  { id: 'gan',   name: '甘松', color: '#6B8E23', volatilizeRate: 0.50, particleColor: '#8BAE3B' }
];

export function getPerfumeById(id: string): Perfume | undefined {
  return PERFUMES.find(p => p.id === id);
}

const STORAGE_KEY = 'ancient_perfume_formulas_v1';
const MAX_FORMULAS = 20;

export class FormulaManager {
  static loadAll(): SavedFormula[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  static save(formula: SavedFormula): SavedFormula[] {
    const all = this.loadAll();
    all.unshift(formula);
    const trimmed = all.slice(0, MAX_FORMULAS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }

  static delete(id: string): SavedFormula[] {
    const all = this.loadAll().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all;
  }

  static clearAll(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }

  static generateName(items: FormulaItem[]): string {
    const used = items.filter(i => i.grams > 0).sort((a, b) => b.grams - a.grams);
    const suffixes = ['散', '香', '露', '韵', '和'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    if (used.length === 0) return '无名香';
    if (used.length === 1) {
      const p = getPerfumeById(used[0].perfumeId);
      return p ? p.name[0] + '香' : '单味香';
    }
    const first = getPerfumeById(used[0].perfumeId);
    const second = getPerfumeById(used[1].perfumeId);
    return (first?.name[0] ?? '') + (second?.name[0] ?? '') + suffix;
  }

  static calculateScore(items: FormulaItem[]): number {
    const used = items.filter(i => i.grams > 0);
    if (used.length === 0) return 0;
    const total = used.reduce((s, i) => s + i.grams, 0);
    const variety = used.length;
    const volAvg = used.reduce((s, i) => {
      const p = getPerfumeById(i.perfumeId);
      return s + (p ? p.volatilizeRate * i.grams : 0);
    }, 0) / Math.max(total, 1);
    let score = 1;
    if (variety >= 2) score += 1;
    if (variety >= 3) score += 1;
    if (total >= 6 && total <= 30) score += 0.5;
    if (volAvg >= 0.35 && volAvg <= 0.65) score += 0.5;
    return Math.min(5, Math.max(1, Math.round(score)));
  }

  static createFromItems(items: FormulaItem[]): SavedFormula | null {
    const used = items.filter(i => i.grams > 0);
    if (used.length === 0) return null;
    const total = used.reduce((s, i) => s + i.grams, 0);
    return {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: this.generateName(used),
      items: used.slice(),
      totalGrams: total,
      score: this.calculateScore(used),
      timestamp: Date.now()
    };
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function blendFormulaColors(items: FormulaItem[]): string {
  const used = items.filter(i => i.grams > 0);
  if (used.length === 0) return '#8B7355';
  const total = used.reduce((s, i) => s + i.grams, 0);
  let r = 0, g = 0, b = 0;
  for (const it of used) {
    const p = getPerfumeById(it.perfumeId);
    if (!p) continue;
    const rgb = hexToRgb(p.particleColor);
    const w = it.grams / total;
    r += rgb.r * w;
    g += rgb.g * w;
    b += rgb.b * w;
  }
  return rgbToHex(r, g, b);
}

export function getWeightedDecay(items: FormulaItem[]): number {
  const used = items.filter(i => i.grams > 0);
  if (used.length === 0) return 0.005;
  const total = used.reduce((s, i) => s + i.grams, 0);
  let v = 0;
  for (const it of used) {
    const p = getPerfumeById(it.perfumeId);
    if (!p) continue;
    v += p.volatilizeRate * (it.grams / total);
  }
  return 0.002 + (1 - v) * 0.012;
}
