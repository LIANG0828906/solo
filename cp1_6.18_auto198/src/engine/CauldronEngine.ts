export interface CauldronState {
  ingredients: string[];
  temperature: number;
  progress: number;
  isReacting: boolean;
  result: Recipe | null;
  liquidColor: string;
  cauldronGlow: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  tempMin: number;
  tempMax: number;
  color: string;
  description: string;
}

const INGREDIENT_COLORS: Record<string, string> = {
  fire_stone: '#FF4500',
  frost_grass: '#00BFFF',
  glow_dew: '#FFD700',
  thunder_wood: '#9370DB',
};

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export class CauldronEngine {
  ingredients: string[] = [];
  temperature: number = 20;
  progress: number = 0;
  isReacting: boolean = false;
  result: Recipe | null = null;
  liquidColor: string = '#1A1635';
  cauldronGlow: number = 0;
  private reactionSpeed: number = 0;
  private onStateChange?: (state: CauldronState) => void;
  private checkingRecipe: boolean = false;

  constructor(callback?: (state: CauldronState) => void) {
    this.onStateChange = callback;
  }

  setOnStateChange(cb: (state: CauldronState) => void) {
    this.onStateChange = cb;
  }

  addIngredient(id: string) {
    if (this.ingredients.includes(id)) return;
    if (this.ingredients.length >= 4) return;
    this.ingredients.push(id);
    this.result = null;
    this.progress = 0;
    this.reactionSpeed = 0;
    this.isReacting = false;
    this.updateLiquidColor();
    this.checkAndStartReaction();
    this.emitState();
  }

  removeIngredient(id: string) {
    this.ingredients = this.ingredients.filter(i => i !== id);
    this.result = null;
    this.progress = 0;
    this.reactionSpeed = 0;
    this.isReacting = false;
    this.updateLiquidColor();
    if (this.ingredients.length > 0) {
      this.checkAndStartReaction();
    }
    this.emitState();
  }

  setTemperature(temp: number) {
    this.temperature = Math.max(-20, Math.min(120, temp));
    this.updateLiquidColor();
    if (this.ingredients.length > 0 && !this.result) {
      this.checkAndStartReaction();
    }
    this.emitState();
  }

  update(dt: number) {
    if (this.isReacting && !this.result) {
      this.progress += dt * (16 + this.reactionSpeed * 8);
      if (this.progress >= 100) {
        this.progress = 100;
        this.completeReaction();
      }
      this.emitState();
    }
    if (this.cauldronGlow > 0) {
      this.cauldronGlow = Math.max(0, this.cauldronGlow - dt * 3);
    }
  }

  setGlow(intensity: number) {
    this.cauldronGlow = intensity;
  }

  reset() {
    this.ingredients = [];
    this.temperature = 20;
    this.progress = 0;
    this.isReacting = false;
    this.result = null;
    this.reactionSpeed = 0;
    this.liquidColor = '#1A1635';
    this.cauldronGlow = 0;
    this.emitState();
  }

  async checkAndStartReaction() {
    if (this.checkingRecipe) return;
    this.checkingRecipe = true;
    try {
      const resp = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: this.ingredients,
          temperature: this.temperature,
        }),
      });
      const data = await resp.json();
      if (data && data.id) {
        this.isReacting = true;
        this.reactionSpeed = this.ingredients.length;
      } else {
        this.isReacting = false;
        this.reactionSpeed = 0;
        if (this.progress > 0 && this.progress < 100) {
          this.progress = Math.max(0, this.progress - 5);
        }
      }
    } catch {
      this.isReacting = false;
    }
    this.checkingRecipe = false;
  }

  private async completeReaction() {
    try {
      const resp = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: this.ingredients,
          temperature: this.temperature,
        }),
      });
      const data = await resp.json();
      this.result = data;
    } catch {
      this.result = null;
    }
    this.isReacting = false;
    this.emitState();
  }

  private updateLiquidColor() {
    if (this.ingredients.length === 0) {
      this.liquidColor = '#1A1635';
      return;
    }
    let r = 0, g = 0, b = 0;
    for (const id of this.ingredients) {
      const c = INGREDIENT_COLORS[id] || '#1A1635';
      r += parseInt(c.slice(1, 3), 16);
      g += parseInt(c.slice(3, 5), 16);
      b += parseInt(c.slice(5, 7), 16);
    }
    const n = this.ingredients.length;
    r = Math.round(r / n);
    g = Math.round(g / n);
    b = Math.round(b / n);
    let base = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const tempNorm = (this.temperature + 20) / 140;
    if (tempNorm < 0.35) {
      base = lerpColor(base, '#1E90FF', (0.35 - tempNorm) * 1.5);
    } else if (tempNorm > 0.65) {
      base = lerpColor(base, '#FF4500', (tempNorm - 0.65) * 1.5);
    }
    this.liquidColor = base;
  }

  private emitState() {
    this.onStateChange?.({
      ingredients: [...this.ingredients],
      temperature: this.temperature,
      progress: this.progress,
      isReacting: this.isReacting,
      result: this.result,
      liquidColor: this.liquidColor,
      cauldronGlow: this.cauldronGlow,
    });
  }

  getState(): CauldronState {
    return {
      ingredients: [...this.ingredients],
      temperature: this.temperature,
      progress: this.progress,
      isReacting: this.isReacting,
      result: this.result,
      liquidColor: this.liquidColor,
      cauldronGlow: this.cauldronGlow,
    };
  }
}
