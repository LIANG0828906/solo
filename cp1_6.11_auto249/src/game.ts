import {
  SPICES,
  RECIPES,
  Spice,
  Recipe,
  getSpiceById,
  getRecipeById,
  AGEING_DURATION_DEFAULT,
  AGEING_DURATION_FAST,
  MAX_SELECTED_SPICES
} from './data';

export interface SelectedSpice {
  spiceId: string;
  percentage: number;
}

export interface IncensePill {
  id: string;
  recipeId: string | null;
  recipeName: string;
  color: string;
  ingredients: SelectedSpice[];
  fineness: number;
  ageingDuration: number;
  ageingRemaining: number;
  isAged: boolean;
  createdAt: number;
  particleColors: string[];
}

export interface LedgerRecord {
  id: string;
  completedAt: number;
  recipeId: string | null;
  recipeName: string;
  ingredients: SelectedSpice[];
  fineness: number;
  ageingDuration: number;
}

export type GameState = {
  selectedSpices: SelectedSpice[];
  fineness: number;
  isGrinding: boolean;
  pills: IncensePill[];
  ledger: LedgerRecord[];
};

export class Game {
  private state: GameState;
  private listeners: Set<() => void> = new Set();
  private ageingIntervals: Map<string, number> = new Map();

  constructor() {
    this.state = {
      selectedSpices: [],
      fineness: 0,
      isGrinding: false,
      pills: [],
      ledger: []
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  getState(): GameState {
    return { ...this.state };
  }

  getAllSpices(): Spice[] {
    return SPICES;
  }

  getAllRecipes(): Recipe[] {
    return RECIPES;
  }

  addSpice(spiceId: string): boolean {
    if (this.state.selectedSpices.some(s => s.spiceId === spiceId)) {
      return false;
    }
    if (this.state.selectedSpices.length >= MAX_SELECTED_SPICES) {
      return false;
    }

    const spice = getSpiceById(spiceId);
    if (!spice) return false;

    const count = this.state.selectedSpices.length + 1;
    const evenPercent = Math.floor(100 / count);
    const remainder = 100 - evenPercent * (count - 1);

    this.state.selectedSpices.forEach(s => {
      s.percentage = evenPercent;
    });

    this.state.selectedSpices.push({
      spiceId,
      percentage: remainder
    });

    this.state.fineness = 0;
    this.notify();
    return true;
  }

  removeSpice(spiceId: string): void {
    const idx = this.state.selectedSpices.findIndex(s => s.spiceId === spiceId);
    if (idx === -1) return;

    this.state.selectedSpices.splice(idx, 1);

    if (this.state.selectedSpices.length > 0) {
      const count = this.state.selectedSpices.length;
      const evenPercent = Math.floor(100 / count);
      const remainder = 100 - evenPercent * (count - 1);
      this.state.selectedSpices.forEach((s, i) => {
        s.percentage = i === count - 1 ? remainder : evenPercent;
      });
    }

    this.state.fineness = 0;
    this.notify();
  }

  setSpicePercentage(spiceId: string, percentage: number): void {
    const spice = this.state.selectedSpices.find(s => s.spiceId === spiceId);
    if (!spice) return;

    const step = 5;
    percentage = Math.round(percentage / step) * step;
    percentage = Math.max(5, Math.min(95, percentage));

    const others = this.state.selectedSpices.filter(s => s.spiceId !== spiceId);
    const totalOthers = others.reduce((sum, s) => sum + s.percentage, 0);
    const newTotalOthers = 100 - percentage;

    if (totalOthers > 0 && newTotalOthers > 0) {
      const ratio = newTotalOthers / totalOthers;
      others.forEach(s => {
        s.percentage = Math.max(5, Math.round(s.percentage * ratio / step) * step);
      });

      const diff = 100 - percentage - others.reduce((sum, s) => sum + s.percentage, 0);
      if (diff !== 0 && others.length > 0) {
        others[others.length - 1].percentage += diff;
      }
    }

    spice.percentage = percentage;
    this.notify();
  }

  getTotalPercentage(): number {
    return this.state.selectedSpices.reduce((sum, s) => sum + s.percentage, 0);
  }

  setGrinding(grinding: boolean): void {
    this.state.isGrinding = grinding;
    this.notify();
  }

  addGrindingProgress(distance: number): void {
    if (this.state.selectedSpices.length === 0) return;
    const increment = Math.min(distance * 0.08, 2);
    this.state.fineness = Math.min(100, this.state.fineness + increment);
    this.notify();
  }

  matchRecipe(): { matched: boolean; recipe: Recipe | null; closest: Recipe | null; matchRate: number } {
    type MatchResult = { matched: boolean; recipe: Recipe | null; closest: Recipe | null; matchRate: number };
    if (this.state.selectedSpices.length === 0) {
      return { matched: false, recipe: null, closest: null, matchRate: 0 };
    }

    const userMap = new Map(
      this.state.selectedSpices.map(s => [s.spiceId, s.percentage])
    );

    let bestMatch: Recipe | null = null;
    let bestRate = 0;

    for (const recipe of RECIPES) {
      const recipeMap = new Map(
        recipe.ingredients.map(i => [i.spiceId, i.percentage])
      );

      const allSpices = new Set([...userMap.keys(), ...recipeMap.keys()]);
      if (allSpices.size !== recipe.ingredients.length ||
          this.state.selectedSpices.length !== recipe.ingredients.length) {
        continue;
      }

      let totalDiff = 0;
      let allPresent = true;

      for (const [spiceId, userPct] of userMap) {
        const recipePct = recipeMap.get(spiceId);
        if (recipePct === undefined) {
          allPresent = false;
          break;
        }
        totalDiff += Math.abs(userPct - recipePct);
      }

      if (!allPresent) continue;

      const avgDiff = totalDiff / recipe.ingredients.length;
      const rate = Math.max(0, 100 - avgDiff * 3);

      if (rate > bestRate) {
        bestRate = rate;
        bestMatch = recipe;
      }
    }

    const matched = bestMatch !== null && bestRate >= (100 - bestMatch.tolerance * 3);

    return {
      matched,
      recipe: matched ? bestMatch : null,
      closest: bestMatch,
      matchRate: bestRate
    };
  }

  blend(): { success: boolean; pill: IncensePill | null; matchResult: { matched: boolean; recipe: Recipe | null; closest: Recipe | null; matchRate: number } } {
    const matchResult = this.matchRecipe();

    if (this.state.selectedSpices.length === 0) {
      return { success: false, pill: null, matchResult };
    }

    if (this.state.fineness < 30) {
      return { success: false, pill: null, matchResult };
    }

    const totalPercent = this.getTotalPercentage();
    if (totalPercent !== 100) {
      return { success: false, pill: null, matchResult };
    }

    const recipe = matchResult.recipe;
    const recipeId = recipe?.id || null;
    const recipeName = recipe?.name || '未名香';
    const color = recipe?.color || '#A08060';
    const particleColors = recipe?.particleColors || ['#C0A080', '#B09070', '#D0B090'];

    const pill: IncensePill = {
      id: 'pill_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      recipeId,
      recipeName,
      color,
      ingredients: JSON.parse(JSON.stringify(this.state.selectedSpices)),
      fineness: this.state.fineness,
      ageingDuration: AGEING_DURATION_DEFAULT,
      ageingRemaining: AGEING_DURATION_DEFAULT,
      isAged: false,
      createdAt: Date.now(),
      particleColors
    };

    this.state.pills.push(pill);
    this.startAgeing(pill.id);

    this.state.selectedSpices = [];
    this.state.fineness = 0;

    this.notify();
    return { success: true, pill, matchResult };
  }

  private startAgeing(pillId: string): void {
    this.stopAgeing(pillId);

    const intervalId = window.setInterval(() => {
      const pill = this.state.pills.find(p => p.id === pillId);
      if (!pill) {
        this.stopAgeing(pillId);
        return;
      }

      pill.ageingRemaining -= 1;
      if (pill.ageingRemaining <= 0) {
        pill.ageingRemaining = 0;
        pill.isAged = true;
        this.stopAgeing(pillId);
      }
      this.notify();
    }, 1000);

    this.ageingIntervals.set(pillId, intervalId);
  }

  private stopAgeing(pillId: string): void {
    const intervalId = this.ageingIntervals.get(pillId);
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      this.ageingIntervals.delete(pillId);
    }
  }

  accelerateAgeing(pillId: string): void {
    const pill = this.state.pills.find(p => p.id === pillId);
    if (!pill || pill.isAged) return;

    this.stopAgeing(pillId);
    pill.ageingDuration = AGEING_DURATION_FAST;
    pill.ageingRemaining = AGEING_DURATION_FAST;

    const intervalId = window.setInterval(() => {
      const p = this.state.pills.find(pp => pp.id === pillId);
      if (!p) {
        this.stopAgeing(pillId);
        return;
      }
      p.ageingRemaining -= 1;
      if (p.ageingRemaining <= 0) {
        p.ageingRemaining = 0;
        p.isAged = true;
        this.stopAgeing(pillId);
      }
      this.notify();
    }, 1000);

    this.ageingIntervals.set(pillId, intervalId);
  }

  placePillInCenser(pillId: string): LedgerRecord | null {
    const idx = this.state.pills.findIndex(p => p.id === pillId);
    if (idx === -1) return null;

    const pill = this.state.pills[idx];
    if (!pill.isAged) return null;

    this.stopAgeing(pillId);
    this.state.pills.splice(idx, 1);

    const record: LedgerRecord = {
      id: 'record_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      completedAt: Date.now(),
      recipeId: pill.recipeId,
      recipeName: pill.recipeName,
      ingredients: JSON.parse(JSON.stringify(pill.ingredients)),
      fineness: pill.fineness,
      ageingDuration: pill.ageingDuration
    };

    this.state.ledger.unshift(record);
    this.notify();
    return record;
  }

  reapplyRecord(recordId: string): boolean {
    const record = this.state.ledger.find(r => r.id === recordId);
    if (!record) return false;

    this.state.selectedSpices = [];
    for (const ing of record.ingredients) {
      if (this.state.selectedSpices.length >= MAX_SELECTED_SPICES) break;
      this.state.selectedSpices.push({
        spiceId: ing.spiceId,
        percentage: ing.percentage
      });
    }
    this.state.fineness = 0;

    this.notify();
    return true;
  }

  clearWorkArea(): void {
    this.state.selectedSpices = [];
    this.state.fineness = 0;
    this.notify();
  }

  destroy(): void {
    for (const [pillId] of this.ageingIntervals) {
      this.stopAgeing(pillId);
    }
    this.listeners.clear();
  }
}
