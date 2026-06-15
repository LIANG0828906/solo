import { Crop, Monster, DefenseTower, GameState, EventType } from '../types';

export type CombatUpdateCallback = () => void;

export class CombatManager {
  private state: GameState;
  private onCombatUpdate: CombatUpdateCallback;
  private readonly MONSTER_SPEED = 30;
  private readonly TOWER_RANGE = 150;
  private readonly TOWER_FIRE_RATE = 2000;
  private readonly TOWER_DAMAGE = 1;
  private readonly BULLET_SPEED = 400;

  public bullets: Array<{ id: string; x: number; y: number; targetId: string; vx: number; vy: number }> = [];

  constructor(state: GameState, onCombatUpdate: CombatUpdateCallback) {
    this.state = state;
    this.onCombatUpdate = onCombatUpdate;
  }

  spawnMonster(startX: number, startY: number): Monster {
    const monster: Monster = {
      id: `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: startX,
      y: startY,
      hp: 5,
      maxHp: 5,
      targetCropId: null,
    };
    this.state.monsters.push(monster);
    this.notifyUpdate();
    return monster;
  }

  attackMonster(monsterId: string): { defeated: boolean; x: number; y: number } {
    const monster = this.state.monsters.find(m => m.id === monsterId);
    if (!monster) return { defeated: false, x: 0, y: 0 };
    monster.hp--;
    const result = { defeated: monster.hp <= 0, x: monster.x, y: monster.y };
    if (monster.hp <= 0) {
      const idx = this.state.monsters.findIndex(m => m.id === monsterId);
      if (idx !== -1) {
        this.state.monsters.splice(idx, 1);
      }
      this.state.resources.coins += 5;
    }
    this.notifyUpdate();
    return result;
  }

  updateMonsters(deltaTime: number, farmCenterX: number, farmCenterY: number): void {
    this.state.monsters.forEach(monster => {
      if (this.state.crops.length > 0) {
        const findResult = this.state.crops.reduce<{ crop: Crop | null; dist: number }>(
          (acc, crop) => {
            const dx = farmCenterX + (crop.gridX - 2.5) * 60 + 30 - monster.x;
            const dy = farmCenterY + (crop.gridY - 2.5) * 60 + 30 - monster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < acc.dist ? { crop, dist } : acc;
          },
          { crop: null, dist: Infinity }
        );
        const nearestCrop = findResult.crop;
        if (nearestCrop) {
          const targetX = farmCenterX + (nearestCrop.gridX - 2.5) * 60 + 30;
          const targetY = farmCenterY + (nearestCrop.gridY - 2.5) * 60 + 30;
          const dx = targetX - monster.x;
          const dy = targetY - monster.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            monster.x += (dx / dist) * this.MONSTER_SPEED * (deltaTime / 1000);
            monster.y += (dy / dist) * this.MONSTER_SPEED * (deltaTime / 1000);
          } else {
            const cropIdx = this.state.crops.findIndex(c => c.id === nearestCrop.id);
            if (cropIdx !== -1) {
              this.state.crops.splice(cropIdx, 1);
            }
          }
        }
      }
    });
  }

  updateTowers(deltaTime: number): void {
    const now = Date.now();
    this.state.towers.forEach(tower => {
      if (now - tower.lastShootTime >= this.TOWER_FIRE_RATE) {
        const findResult = this.state.monsters.reduce<{ monster: Monster | null; dist: number }>(
          (acc, monster) => {
            const dx = monster.x - tower.x;
            const dy = monster.y - tower.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < acc.dist ? { monster, dist } : acc;
          },
          { monster: null, dist: this.TOWER_RANGE }
        );
        const nearestMonster = findResult.monster;
        if (nearestMonster) {
          const dx = nearestMonster.x - tower.x;
          const dy = nearestMonster.y - tower.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            this.bullets.push({
              id: `bullet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              x: tower.x,
              y: tower.y - 10,
              targetId: nearestMonster.id,
              vx: (dx / dist) * this.BULLET_SPEED,
              vy: (dy / dist) * this.BULLET_SPEED,
            });
            tower.lastShootTime = now;
          }
        }
      }
    });
  }

  updateBullets(deltaTime: number): void {
    const toRemove: string[] = [];
    this.bullets.forEach(bullet => {
      bullet.x += bullet.vx * (deltaTime / 1000);
      bullet.y += bullet.vy * (deltaTime / 1000);
      const target = this.state.monsters.find(m => m.id === bullet.targetId);
      if (target) {
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          this.attackMonster(target.id);
          toRemove.push(bullet.id);
        }
      } else {
        toRemove.push(bullet.id);
      }
    });
    this.bullets = this.bullets.filter(b => !toRemove.includes(b.id));
  }

  getMonsters(): Monster[] {
    return this.state.monsters;
  }

  getTowers(): DefenseTower[] {
    return this.state.towers;
  }

  getBullets() {
    return this.bullets;
  }

  getState(): GameState {
    return this.state;
  }

  private notifyUpdate(): void {
    if (this.onCombatUpdate) {
      this.onCombatUpdate();
    }
  }
}
