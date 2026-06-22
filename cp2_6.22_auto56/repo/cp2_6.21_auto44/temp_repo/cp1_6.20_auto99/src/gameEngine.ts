import { v4 as uuidv4 } from 'uuid';
import {
  GameState, GameStateSnapshot, Tile, Building, BuildingType, BuildingDef,
  Resources, Era, ERA_INFO, BUILDINGS, StatusEffect, EventEffect
} from './types';

export class GameEngine {
  state: GameState;
  listeners: Set<(snap: GameStateSnapshot) => void> = new Set();

  constructor(seed = Date.now()) {
    this.state = this.createInitialState(seed);
  }

  createInitialState(seed: number): GameState {
    const cols = 8, rows = 6;
    const map: Tile[][] = [];
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let y = 0; y < rows; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < cols; x++) {
        const r = rand();
        let terrain: Tile['terrain'] = 'grass';
        if (x === 3 && y >= 1 && y <= 4) terrain = 'river';
        else if (r < 0.18) terrain = 'forest';
        else if (r > 0.9) terrain = 'mountain';
        row.push({ x, y, terrain, building: null });
      }
      map.push(row);
    }
    if (!map[2][1].building && map[2][1].terrain === 'grass') {
      map[2][1].building = { id: uuidv4(), type: 'house', x: 1, y: 2, buildProgress: 1, justBuilt: 0 };
    }
    return {
      turn: 0,
      era: 0,
      population: 5,
      populationCap: 10,
      resources: { food: 10, wood: 5, stone: 2, science: 0 },
      resourcesPrev: { food: 10, wood: 5, stone: 2, science: 0 },
      map, cols, rows,
      statuses: [],
      eventHistory: [],
      techBoost: 0,
      rngSeed: seed,
      justUnlockedEra: undefined
    };
  }

  onUpdate(fn: (snap: GameStateSnapshot) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    const snap: GameStateSnapshot = { ...this.state, timestamp: Date.now(), resources: { ...this.state.resources } };
    this.listeners.forEach(l => l(snap));
  }

  getState(): GameStateSnapshot {
    return { ...this.state, timestamp: Date.now(), resources: { ...this.state.resources } };
  }

  setState(s: GameState) {
    this.state = s;
    this.emit();
  }

  nextTurn(): { deltaPop: number; deltaRes: Partial<Resources>; shouldTriggerEvent: boolean } {
    this.state.resourcesPrev = { ...this.state.resources };
    this.state.turn++;
    this.state.justUnlockedEra = undefined;

    const deltaRes: Partial<Resources> = { food: 0, wood: 0, stone: 0, science: 0 };
    this.state.map.forEach(row => row.forEach(tile => {
      if (!tile.building || tile.building.buildProgress < 1) return;
      const def = BUILDINGS[tile.building.type];
      Object.entries(def.perTurn).forEach(([k, v]) => {
        (deltaRes as Record<string, number>)[k] = ((deltaRes as Record<string, number>)[k] || 0) + (v as number);
      });
      if (tile.building.type === 'irrigation') {
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = tile.x + dx, ny = tile.y + dy;
          if (this.state.map[ny]?.[nx]?.building?.type === 'farm') {
            deltaRes.food = (deltaRes.food || 0) + 1;
          }
        }
      }
    }));

    this.state.statuses.forEach(st => {
      if (st.perTurn) {
        Object.entries(st.perTurn).forEach(([k, v]) => {
          (deltaRes as Record<string, number>)[k] = ((deltaRes as Record<string, number>)[k] || 0) + (v as number);
        });
      }
    });

    const foodConsumed = Math.ceil(this.state.population * 0.8);
    deltaRes.food = (deltaRes.food || 0) - foodConsumed;

    (['food', 'wood', 'stone', 'science'] as const).forEach(k => {
      this.state.resources[k] = Math.max(0, this.state.resources[k] + (deltaRes[k] || 0));
    });

    let deltaPop = 0;
    if (this.state.resources.food <= 0) {
      const starve = Math.min(this.state.population, Math.max(1, Math.floor(this.state.population * 0.15)));
      deltaPop -= starve;
    } else if (this.state.resources.food > this.state.population * 2 && this.state.population < this.state.populationCap) {
      deltaPop += Math.max(1, Math.floor(this.state.population * 0.08));
    }
    deltaPop = Math.max(-this.state.population, Math.min(deltaPop, this.state.populationCap - this.state.population));
    this.state.population += deltaPop;

    this.state.statuses = this.state.statuses
      .map(s => ({ ...s, turns: s.turns - 1 }))
      .filter(s => s.turns > 0);

    this.state.map.forEach(row => row.forEach(tile => {
      if (tile.building && tile.building.buildProgress < 1) {
        tile.building.buildProgress = Math.min(1, tile.building.buildProgress + 0.5);
        if (tile.building.buildProgress >= 1) {
          tile.building.justBuilt = Date.now();
          const def = BUILDINGS[tile.building.type];
          if (def.popCapBonus) this.state.populationCap += def.popCapBonus;
        }
      }
    }));

    const newEra = this.computeEra();
    if (newEra !== this.state.era) {
      this.state.era = newEra;
      this.state.justUnlockedEra = newEra;
    }

    this.state.resources.science += Math.floor(this.state.population * (0.1 + this.state.techBoost));
    this.state.techBoost = Math.max(0, this.state.techBoost - 0.02);

    const shouldTriggerEvent = this.state.turn % 5 === 0;
    this.emit();
    return { deltaPop, deltaRes, shouldTriggerEvent };
  }

  computeEra(): Era {
    const p = this.state.population;
    if (p >= ERA_INFO[3].pop) return 3;
    if (p >= ERA_INFO[2].pop) return 2;
    if (p >= ERA_INFO[1].pop) return 1;
    return 0;
  }

  canBuild(x: number, y: number, type: BuildingType): { ok: boolean; reason?: string } {
    const tile = this.state.map[y]?.[x];
    if (!tile) return { ok: false, reason: '无效位置' };
    if (tile.building) return { ok: false, reason: '位置已占用' };
    if (tile.terrain === 'river') return { ok: false, reason: '河流无法建造' };
    const def = BUILDINGS[type];
    if (!def) return { ok: false, reason: '未知建筑' };
    if (this.state.era < def.minEra) return { ok: false, reason: '需要更高时代' };
    for (const [k, v] of Object.entries(def.cost)) {
      if ((this.state.resources as unknown as Record<string, number>)[k] < (v as number)) {
        return { ok: false, reason: `${this.resLabel(k)}不足` };
      }
    }
    return { ok: true };
  }

  resLabel(k: string) { return ({ food: '食物', wood: '木材', stone: '石器', science: '科技' } as Record<string, string>)[k] || k; }

  build(x: number, y: number, type: BuildingType): Building | null {
    const c = this.canBuild(x, y, type);
    if (!c.ok) return null;
    const def = BUILDINGS[type];
    for (const [k, v] of Object.entries(def.cost)) {
      (this.state.resources as unknown as Record<string, number>)[k] -= (v as number);
    }
    const b: Building = { id: uuidv4(), type, x, y, buildProgress: 0, justBuilt: 0 };
    this.state.map[y][x].building = b;
    this.emit();
    return b;
  }

  getAvailableBuildings(): BuildingDef[] {
    return Object.values(BUILDINGS).filter(b => b.minEra <= this.state.era);
  }

  applyEventEffect(eff: EventEffect): { destroyedBuildings: number; resultText: string } {
    let destroyed = 0;
    const parts: string[] = [];
    if (eff.food) { this.state.resources.food = Math.max(0, this.state.resources.food + eff.food); parts.push(`食物${eff.food>0?'+':''}${eff.food}`); }
    if (eff.wood) { this.state.resources.wood = Math.max(0, this.state.resources.wood + eff.wood); parts.push(`木材${eff.wood>0?'+':''}${eff.wood}`); }
    if (eff.stone) { this.state.resources.stone = Math.max(0, this.state.resources.stone + eff.stone); parts.push(`石器${eff.stone>0?'+':''}${eff.stone}`); }
    if (eff.science) { this.state.resources.science = Math.max(0, this.state.resources.science + eff.science); parts.push(`科技${eff.science>0?'+':''}${eff.science}`); }
    if (eff.foodBonus) { this.state.resources.food += eff.foodBonus; parts.push(`食物+${eff.foodBonus}`); }
    if (eff.population) {
      const before = this.state.population;
      this.state.population = Math.max(0, Math.min(this.state.populationCap, this.state.population + eff.population));
      if (this.state.population !== before) parts.push(`人口${this.state.population-before>0?'+':''}${this.state.population-before}`);
    }
    if (eff.populationPercent) {
      const chg = Math.floor(this.state.population * eff.populationPercent);
      if (chg !== 0) {
        this.state.population = Math.max(0, this.state.population + chg);
        parts.push(`人口${chg>0?'+':''}${chg}`);
      }
    }
    if (eff.randomBuildingDestroy) {
      const all: Building[] = [];
      this.state.map.forEach(r => r.forEach(t => { if (t.building) all.push(t.building); }));
      for (let i = 0; i < eff.randomBuildingDestroy && all.length > 0; i++) {
        const idx = Math.floor(Math.random() * all.length);
        const b = all.splice(idx, 1)[0];
        this.state.map[b.y][b.x].building = null;
        destroyed++;
      }
      if (destroyed > 0) parts.push(`建筑-${destroyed}`);
    }
    if (eff.status) {
      this.state.statuses.push({ ...eff.status });
      parts.push(`获得状态：${eff.status.name}`);
    }
    if (eff.techBoost) {
      this.state.techBoost += eff.techBoost;
      parts.push(`科技加速${Math.round(eff.techBoost*100)}%`);
    }
    const newEra = this.computeEra();
    if (newEra !== this.state.era) {
      this.state.era = newEra;
      this.state.justUnlockedEra = newEra;
    }
    this.emit();
    return { destroyedBuildings: destroyed, resultText: parts.join('，') };
  }

  addStatus(st: StatusEffect) { this.state.statuses.push({ ...st }); this.emit(); }
}
