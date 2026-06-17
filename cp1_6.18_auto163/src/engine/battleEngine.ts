import {
  Card, CardLevel, Element,
  getElementMultiplier, trySynthesis, generateRandomCard,
  generateStarterHand, AreaEffect
} from './cardEngine';
import { AIEngine, Enemy, AIAction } from './aiEngine';

export interface GridCell {
  card: Card | null;
  element: Element | null;
  pulsePhase: number;
  areaEffects: ActiveAreaEffect[];
}

export interface ActiveAreaEffect {
  type: 'burn' | 'freeze' | 'poison' | 'curse';
  duration: number;
  damage: number;
  sourceElement: Element;
}

export interface Combo {
  positions: { row: number; col: number }[];
  multiplier: number;
  element: Element;
  totalDamage: number;
}

export interface DamageResult {
  totalDamage: number;
  enemyDamages: { enemyId: string; damage: number; killed: boolean }[];
  combos: Combo[];
  synthesized: boolean;
  synthesisCard?: Card;
}

export interface BattleState {
  grid: GridCell[][];
  hand: Card[];
  enemies: Enemy[];
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  score: number;
  wave: number;
  gameOver: boolean;
  selectedCard: Card | null;
  message: string;
  messageTimer: number;
}

const GRID_SIZE = 3;
const PLAYER_MAX_HP = 100;
const ENEMY_SPAWN_INTERVAL = 3;
const BASE_ENEMY_HP = 30;
const BASE_ENEMY_ATTACK = 8;

type BattleEventListener = (state: BattleState) => void;

export class BattleEngine {
  private grid: GridCell[][];
  private hand: Card[];
  private enemies: Enemy[];
  private playerHp: number;
  private playerMaxHp: number;
  private turn: number;
  private score: number;
  private wave: number;
  private gameOver: boolean;
  private selectedCard: Card | null;
  private message: string;
  private messageTimer: number;
  private aiEngine: AIEngine;
  private listeners: BattleEventListener[] = [];

  constructor() {
    this.grid = this.createEmptyGrid();
    this.hand = generateStarterHand(5);
    this.enemies = [];
    this.playerHp = PLAYER_MAX_HP;
    this.playerMaxHp = PLAYER_MAX_HP;
    this.turn = 1;
    this.score = 0;
    this.wave = 0;
    this.gameOver = false;
    this.selectedCard = null;
    this.message = '';
    this.messageTimer = 0;
    this.aiEngine = new AIEngine();
  }

  private createEmptyGrid(): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = {
          card: null,
          element: null,
          pulsePhase: Math.random() * Math.PI * 2,
          areaEffects: []
        };
      }
    }
    return grid;
  }

  getState(): BattleState {
    return {
      grid: this.grid,
      hand: [...this.hand],
      enemies: [...this.enemies],
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      turn: this.turn,
      score: this.score,
      wave: this.wave,
      gameOver: this.gameOver,
      selectedCard: this.selectedCard,
      message: this.message,
      messageTimer: this.messageTimer
    };
  }

  onStateChange(listener: BattleEventListener) {
    this.listeners.push(listener);
  }

  private notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  selectCard(card: Card) {
    this.selectedCard = card;
    this.notify();
  }

  deselectCard() {
    this.selectedCard = null;
    this.notify();
  }

  placeCard(row: number, col: number): DamageResult | null {
    if (this.gameOver) return null;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    if (this.grid[row][col].card !== null) return null;

    const card = this.selectedCard;
    if (!card) return null;

    const handIdx = this.hand.findIndex(c => c.id === card.id);
    if (handIdx === -1) return null;

    this.grid[row][col].card = card;
    this.grid[row][col].element = card.element;
    this.grid[row][col].pulsePhase = 0;

    this.hand.splice(handIdx, 1);
    this.selectedCard = null;

    this.applyAreaEffectsToCell(row, col);

    const combos = this.detectCombos(row, col);

    let synthesized = false;
    let synthesisCard: Card | undefined;
    const synthesisResult = trySynthesis(this.grid, row, col);
    if (synthesisResult) {
      synthesized = true;
      synthesisCard = synthesisResult.card;
      for (const pos of synthesisResult.consumedPositions) {
        if (pos.row === row && pos.col === col) continue;
        this.grid[pos.row][pos.col].card = null;
        this.grid[pos.row][pos.col].element = null;
        this.grid[pos.row][pos.col].areaEffects = [];
      }
      this.grid[row][col].card = synthesisResult.card;
      this.grid[row][col].element = synthesisResult.card.element;
      this.message = `合成成功！${synthesisResult.card.name}`;
      this.messageTimer = 2;
    }

    const damageResult = this.calculateDamage(combos, synthesized, synthesisCard);

    this.applyDamageToEnemies(damageResult);

    if (this.hand.length < 5) {
      this.hand.push(generateRandomCard());
    }

    this.advanceTurn();

    return damageResult;
  }

  private applyAreaEffectsToCell(row: number, col: number) {
    const card = this.grid[row][col].card;
    if (!card || !card.areaEffect) return;

    const neighbors = this.getNeighbors(row, col);
    for (const n of neighbors) {
      this.grid[n.row][n.col].areaEffects.push({
        type: card.areaEffect.type,
        duration: card.areaEffect.duration,
        damage: card.areaEffect.damage,
        sourceElement: card.element
      });
    }
  }

  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const neighbors: { row: number; col: number }[] = [];
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        neighbors.push({ row: nr, col: nc });
      }
    }
    return neighbors;
  }

  private detectCombos(row: number, col: number): Combo[] {
    const card = this.grid[row][col].card;
    if (!card) return [];

    const combos: Combo[] = [];
    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];

    for (const { dr, dc } of directions) {
      const positions: { row: number; col: number }[] = [{ row, col }];

      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        if (this.grid[r][c].card && this.grid[r][c].card!.element === card.element) {
          positions.push({ row: r, col: c });
        }
        r += dr;
        c += dc;
      }

      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        if (this.grid[r][c].card && this.grid[r][c].card!.element === card.element) {
          positions.push({ row: r, col: c });
        }
        r -= dr;
        c -= dc;
      }

      if (positions.length >= 2) {
        const multiplier = 1 + (positions.length - 1) * 0.5;
        const totalDamage = Math.floor(card.attack * multiplier);
        combos.push({
          positions,
          multiplier,
          element: card.element,
          totalDamage
        });
      }
    }

    const lCombos = this.detectLCombos(row, col, card.element);
    combos.push(...lCombos);

    return combos;
  }

  private detectLCombos(row: number, col: number, element: Element): Combo[] {
    const combos: Combo[] = [];
    const arms = [
      [[-1, 0], [0, 1]],
      [[-1, 0], [0, -1]],
      [[1, 0], [0, 1]],
      [[1, 0], [0, -1]],
      [[-1, 0], [1, 0]],
      [[0, -1], [0, 1]],
      [[-1, -1], [1, 1]],
      [[-1, 1], [1, -1]]
    ];

    for (const [dir1, dir2] of arms) {
      const p1r = row + dir1[0];
      const p1c = col + dir1[1];
      const p2r = row + dir2[0];
      const p2c = col + dir2[1];

      if (p1r < 0 || p1r >= GRID_SIZE || p1c < 0 || p1c >= GRID_SIZE) continue;
      if (p2r < 0 || p2r >= GRID_SIZE || p2c < 0 || p2c >= GRID_SIZE) continue;

      const c1 = this.grid[p1r][p1c].card;
      const c2 = this.grid[p2r][p2c].card;

      if (c1 && c1.element === element && c2 && c2.element === element) {
        const positions = [
          { row, col },
          { row: p1r, col: p1c },
          { row: p2r, col: p2c }
        ];
        const multiplier = 1 + (positions.length - 1) * 0.5;
        const card = this.grid[row][col].card!;
        const totalDamage = Math.floor(card.attack * multiplier);
        combos.push({
          positions,
          multiplier,
          element,
          totalDamage
        });
      }
    }

    return combos;
  }

  private calculateDamage(
    combos: Combo[],
    synthesized: boolean,
    synthesisCard?: Card
  ): DamageResult {
    let totalDamage = 0;
    const enemyDamages: { enemyId: string; damage: number; killed: boolean }[] = [];

    if (this.enemies.length === 0) {
      return { totalDamage: 0, enemyDamages: [], combos, synthesized, synthesisCard };
    }

    const baseDamage = combos.reduce((sum, combo) => sum + combo.totalDamage, 0);
    totalDamage = baseDamage;

    if (synthesized && synthesisCard) {
      totalDamage += synthesisCard.attack;
    }

    for (const enemy of this.enemies) {
      let effectiveDamage = totalDamage;

      const primaryCombo = combos.length > 0 ? combos[0] : null;
      if (primaryCombo) {
        const mult = getElementMultiplier(primaryCombo.element, enemy.element);
        effectiveDamage = Math.floor(totalDamage * mult);
      }

      const resistance = enemy.resistances[primaryCombo?.element || Element.Fire] || 0;
      effectiveDamage = Math.floor(effectiveDamage * (1 - resistance));

      effectiveDamage = Math.max(1, effectiveDamage);

      enemy.hp -= effectiveDamage;
      const killed = enemy.hp <= 0;
      if (killed) {
        enemy.hp = 0;
      }

      enemyDamages.push({
        enemyId: enemy.id,
        damage: effectiveDamage,
        killed
      });
    }

    return {
      totalDamage,
      enemyDamages,
      combos,
      synthesized,
      synthesisCard
    };
  }

  private applyDamageToEnemies(result: DamageResult) {
    const killedIds: string[] = [];
    for (const ed of result.enemyDamages) {
      if (ed.killed) {
        killedIds.push(ed.enemyId);
        this.score += 100;
        this.hand.push(generateRandomCard());
      }
    }

    if (killedIds.length > 0) {
      this.enemies = this.enemies.filter(e => !killedIds.includes(e.id));
      this.message = `击败了 ${killedIds.length} 个敌人！`;
      this.messageTimer = 2;
    }

    if (result.combos.length > 0 && killedIds.length === 0) {
      this.message = `连击！伤害 x${result.combos[0].multiplier.toFixed(1)}`;
      this.messageTimer = 1.5;
    }

    if (result.synthesized) {
      this.message = `合成高级符文！`;
      this.messageTimer = 2;
    }
  }

  private advanceTurn() {
    this.turn++;

    this.processAreaEffects();

    if (this.enemies.length > 0) {
      this.executeEnemyTurn();
    }

    if (this.turn % ENEMY_SPAWN_INTERVAL === 1) {
      this.spawnEnemies();
    }

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.gameOver = true;
      this.message = '游戏结束';
      this.messageTimer = 999;
    }

    this.notify();
  }

  private processAreaEffects() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        const remaining: ActiveAreaEffect[] = [];
        for (const effect of cell.areaEffects) {
          if (cell.card) {
            const dotDamage = effect.damage;
            for (const enemy of this.enemies) {
              const mult = getElementMultiplier(effect.sourceElement, enemy.element);
              const res = enemy.resistances[effect.sourceElement] || 0;
              const finalDmg = Math.max(1, Math.floor(dotDamage * mult * (1 - res)));
              enemy.hp -= finalDmg;
            }
          }
          effect.duration--;
          if (effect.duration > 0) {
            remaining.push(effect);
          }
        }
        cell.areaEffects = remaining;

        if (this.enemies.length > 0) {
          this.enemies = this.enemies.filter(e => e.hp > 0);
        }
      }
    }
  }

  private executeEnemyTurn() {
    const actions = this.aiEngine.decideActions(this.enemies, this.grid, this.playerHp, this.playerMaxHp);
    for (const action of actions) {
      const enemy = this.enemies.find(e => e.id === action.enemyId);
      if (!enemy || enemy.hp <= 0) continue;

      if (action.type === 'attack') {
        this.playerHp -= action.damage;
      } else if (action.type === 'defend') {
        enemy.resistances[Element.Fire] = (enemy.resistances[Element.Fire] || 0) + 0.1;
        enemy.resistances[Element.Water] = (enemy.resistances[Element.Water] || 0) + 0.1;
        enemy.resistances[Element.Grass] = (enemy.resistances[Element.Grass] || 0) + 0.1;
        enemy.resistances[Element.Dark] = (enemy.resistances[Element.Dark] || 0) + 0.1;
      }
    }
  }

  private spawnEnemies() {
    this.wave++;
    const enemyCount = Math.min(1 + Math.floor(this.wave / 2), 3);

    for (let i = 0; i < enemyCount; i++) {
      const elementPool = [Element.Fire, Element.Water, Element.Grass, Element.Dark];
      const element = elementPool[Math.floor(Math.random() * elementPool.length)];

      const hpMult = 1 + (this.wave - 1) * 0.3;
      const atkMult = 1 + (this.wave - 1) * 0.2;

      const enemy: Enemy = {
        id: `enemy_${this.wave}_${i}`,
        name: this.getEnemyName(element, this.wave),
        hp: Math.floor(BASE_ENEMY_HP * hpMult),
        maxHp: Math.floor(BASE_ENEMY_HP * hpMult),
        attack: Math.floor(BASE_ENEMY_ATTACK * atkMult),
        element,
        resistances: this.getEnemyResistances(element, this.wave)
      };

      this.enemies.push(enemy);
    }

    this.message = `第 ${this.wave} 波敌人来袭！`;
    this.messageTimer = 2;
  }

  private getEnemyName(element: Element, wave: number): string {
    const names: Record<Element, string[]> = {
      [Element.Fire]: ['火焰傀儡', '烈焰守卫', '炎魔'],
      [Element.Water]: ['冰霜精灵', '深海猎人', '潮汐领主'],
      [Element.Grass]: ['藤蔓怪', '森林守卫', '古树精'],
      [Element.Dark]: ['暗影刺客', '虚空行者', '冥界骑士']
    };
    const pool = names[element];
    const idx = Math.min(wave - 1, pool.length - 1);
    return pool[idx];
  }

  private getEnemyResistances(element: Element, wave: number): Partial<Record<Element, number>> {
    const base: Partial<Record<Element, number>> = {};
    base[element] = 0.5;
    if (wave >= 3) {
      const opposite = element === Element.Fire ? Element.Water
        : element === Element.Water ? Element.Fire
        : element === Element.Grass ? Element.Fire
        : Element.Grass;
      base[opposite] = 0.2;
    }
    return base;
  }

  update(dt: number) {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        this.message = '';
        this.messageTimer = 0;
      }
    }
  }

  restart() {
    this.grid = this.createEmptyGrid();
    this.hand = generateStarterHand(5);
    this.enemies = [];
    this.playerHp = PLAYER_MAX_HP;
    this.playerMaxHp = PLAYER_MAX_HP;
    this.turn = 1;
    this.score = 0;
    this.wave = 0;
    this.gameOver = false;
    this.selectedCard = null;
    this.message = '';
    this.messageTimer = 0;
    this.notify();
  }
}
