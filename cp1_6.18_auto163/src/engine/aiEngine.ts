import { Element } from './cardEngine';
import { GridCell } from './battleEngine';

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  element: Element;
  resistances: Partial<Record<Element, number>>;
}

export interface AIAction {
  enemyId: string;
  type: 'attack' | 'defend';
  damage: number;
}

type Strategy = 'aggressive' | 'defensive' | 'balanced';

export class AIEngine {
  decideActions(
    enemies: Enemy[],
    grid: GridCell[][],
    playerHp: number,
    playerMaxHp: number
  ): AIAction[] {
    const actions: AIAction[] = [];

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;

      const strategy = this.selectStrategy(enemy, grid, playerHp, playerMaxHp);
      const action = this.generateAction(enemy, strategy);
      actions.push(action);
    }

    return actions;
  }

  private selectStrategy(
    enemy: Enemy,
    grid: GridCell[][],
    playerHp: number,
    playerMaxHp: number
  ): Strategy {
    const hpRatio = enemy.hp / enemy.maxHp;
    const playerHpRatio = playerHp / playerMaxHp;

    let filledCells = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c].card) filledCells++;
      }
    }

    if (hpRatio < 0.3) return 'defensive';
    if (playerHpRatio < 0.3) return 'aggressive';
    if (filledCells >= 6) return 'aggressive';

    if (hpRatio > 0.7 && filledCells < 4) return 'aggressive';
    if (hpRatio < 0.5) return 'defensive';

    return 'balanced';
  }

  private generateAction(enemy: Enemy, strategy: Strategy): AIAction {
    if (strategy === 'aggressive') {
      return {
        enemyId: enemy.id,
        type: 'attack',
        damage: enemy.attack
      };
    }

    if (strategy === 'defensive') {
      if (Math.random() < 0.6) {
        return {
          enemyId: enemy.id,
          type: 'defend',
          damage: 0
        };
      }
      return {
        enemyId: enemy.id,
        type: 'attack',
        damage: Math.floor(enemy.attack * 0.5)
      };
    }

    if (Math.random() < 0.7) {
      return {
        enemyId: enemy.id,
        type: 'attack',
        damage: enemy.attack
      };
    }

    return {
      enemyId: enemy.id,
      type: 'defend',
      damage: 0
    };
  }
}
