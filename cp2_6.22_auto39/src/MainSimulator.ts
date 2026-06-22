import type { Item, Monster, PlayerStats, CombatResult, Difficulty } from './types';
import { ItemGenerator } from './procedural/ItemGenerator';
import { CraftRecipe } from './procedural/CraftRecipe';
import { MonsterTemplate } from './combat/MonsterTemplate';
import { CombatEngine } from './combat/CombatEngine';

export interface GameState {
  difficulty: Difficulty;
  level: number;
  playerBase: PlayerStats;
  inventory: Item[];
  equipped: { weapon?: Item; armor?: Item; accessory?: Item };
  battleRewards: Item[];
  monsters: Monster[];
  lastCombat?: CombatResult;
  combatPlaying: boolean;
}

export type Listener = (state: GameState) => void;

const BASE_PLAYER: PlayerStats = {
  maxHp: 200,
  hp: 200,
  attack: 20,
  defense: 10,
  critRate: 5,
};

export class MainSimulator {
  private state: GameState;
  private listeners: Set<Listener> = new Set();
  private combatEngine = new CombatEngine();

  constructor() {
    this.state = {
      difficulty: 'normal',
      level: 1,
      playerBase: { ...BASE_PLAYER },
      inventory: [],
      equipped: {},
      battleRewards: [],
      monsters: [],
      combatPlaying: false,
    };
  }

  getState(): GameState {
    return { ...this.state, inventory: [...this.state.inventory], battleRewards: [...this.state.battleRewards], monsters: [...this.state.monsters] };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.getState();
    this.listeners.forEach((l) => l(snap));
  }

  setDifficulty(d: Difficulty) {
    this.state.difficulty = d;
    this.resetLevel();
  }

  resetLevel() {
    this.state.level = 1;
    this.state.playerBase = { ...BASE_PLAYER };
    this.state.inventory = [];
    this.state.equipped = {};
    this.state.battleRewards = [];
    this.state.monsters = [];
    this.state.lastCombat = undefined;
    this.state.combatPlaying = false;
    this.emit();
  }

  enterBattle(): Item[] {
    this.state.battleRewards = ItemGenerator.generate(3 + Math.floor(Math.random() * 3), this.state.difficulty);
    this.state.monsters = MonsterTemplate.generate(this.state.level, this.state.difficulty);
    this.state.combatPlaying = true;
    this.emit();
    return this.state.battleRewards;
  }

  runCombat(): CombatResult | null {
    const equipped = [this.state.equipped.weapon, this.state.equipped.armor, this.state.equipped.accessory].filter(Boolean) as Item[];
    if (this.state.monsters.length === 0) return null;
    const result = this.combatEngine.simulate(this.state.playerBase, equipped, this.state.monsters);
    this.state.lastCombat = result;
    this.state.playerBase.hp = result.playerHp;
    this.state.combatPlaying = false;
    if (result.victory) {
      this.state.inventory.push(...this.state.battleRewards);
      this.state.battleRewards = [];
      this.state.level++;
    }
    this.emit();
    return result;
  }

  equipItem(item: Item): boolean {
    const slot = item.type;
    if (this.state.equipped[slot]) {
      const cur = this.state.equipped[slot]!;
      this.state.inventory.push(cur);
    }
    this.state.equipped[slot] = item;
    this.state.inventory = this.state.inventory.filter((i) => i.id !== item.id);
    this.emit();
    return true;
  }

  unequipItem(type: 'weapon' | 'armor' | 'accessory') {
    const it = this.state.equipped[type];
    if (!it) return;
    this.state.inventory.push(it);
    delete this.state.equipped[type];
    this.emit();
  }

  getEquippedItems(): Item[] {
    return [this.state.equipped.weapon, this.state.equipped.armor, this.state.equipped.accessory].filter(Boolean) as Item[];
  }

  craft(materials: (Item | undefined)[]): { success: boolean; result?: Item; error?: string; consumedIds?: string[] } {
    const items = materials.filter(Boolean) as Item[];
    const check = CraftRecipe.canCraft(items);
    if (!check.ok) return { success: false, error: check.reason };

    const res = CraftRecipe.craft(items);
    if (!res.success || !res.result) return { success: false, error: res.error };

    const consumedIds = items.map((i) => i.id);
    for (const id of consumedIds) {
      this.state.inventory = this.state.inventory.filter((i) => i.id !== id);
      Object.keys(this.state.equipped).forEach((k) => {
        const key = k as keyof typeof this.state.equipped;
        if (this.state.equipped[key]?.id === id) delete this.state.equipped[key];
      });
    }

    this.state.inventory.push(res.result);
    this.emit();
    return { success: true, result: res.result, consumedIds };
  }
}

export const simulator = new MainSimulator();
