import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type {
  TowerData,
  EnemyData,
  TowerType,
  EnemyType,
  Rune,
  RuneType
} from '../types';
import { RUNE_CONFIGS as RUNE_CFG, TOWER_CONFIGS, ENEMY_CONFIGS, PATH_POINTS } from '../types';

console.log('[TRACE] 初始化 gameStore...');

interface GameState {
  gold: number;
  lives: number;
  wave: number;
  towers: TowerData[];
  enemies: EnemyData[];
  runeInventory: Rune[];
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;
  isWaveActive: boolean;
  isPaused: boolean;
  gameOver: boolean;
  score: number;

  buildTower: (type: TowerType, gridX: number, gridY: number) => boolean;
  upgradeTower: (towerId: string) => boolean;
  sellTower: (towerId: string) => void;
  embedRune: (towerId: string, slotIndex: number, runeId: string) => boolean;
  removeRune: (towerId: string, slotIndex: number) => Rune | null;
  spawnEnemy: (type: EnemyType) => void;
  damageEnemy: (enemyId: string, damage: number, runes?: Rune[]) => { killed: boolean; reward: number };
  removeEnemy: (enemyId: string) => void;
  enemyReachedEnd: (enemyId: string) => void;
  dropRune: () => Rune | null;
  setSelectedTowerType: (type: TowerType | null) => void;
  setSelectedTowerId: (id: string | null) => void;
  startWave: () => void;
  togglePause: () => void;
  resetGame: () => void;
  loadGame: () => Promise<void>;
  saveGame: () => Promise<void>;
}

const initialState = {
  gold: 200,
  lives: 20,
  wave: 0,
  towers: [],
  enemies: [],
  runeInventory: [],
  selectedTowerType: null,
  selectedTowerId: null,
  isWaveActive: false,
  isPaused: false,
  gameOver: false,
  score: 0
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  buildTower: (type: TowerType, gridX: number, gridY: number) => {
    const state = get();
    const config = TOWER_CONFIGS[type];

    if (state.gold < config.cost) {
      console.log('[TRACE] 金币不足，无法建造', type);
      return false;
    }

    const exists = state.towers.some(
      t => t.gridX === gridX && t.gridY === gridY
    );
    if (exists) {
      console.log('[TRACE] 该位置已有塔');
      return false;
    }

    console.log('[TRACE] 建造塔:', type, '位置:', gridX, gridY);

    const newTower: TowerData = {
      id: uuidv4(),
      type,
      gridX,
      gridY,
      level: 1,
      runeSlots: [null, null, null]
    };

    set({
      gold: state.gold - config.cost,
      towers: [...state.towers, newTower]
    });

    return true;
  },

  upgradeTower: (towerId: string) => {
    const state = get();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) return false;

    const upgradeCost = Math.floor(50 * Math.pow(1.5, tower.level));
    if (state.gold < upgradeCost) return false;
    if (tower.level >= 5) return false;

    console.log('[TRACE] 升级塔:', towerId, '等级:', tower.level, '->', tower.level + 1);

    set({
      gold: state.gold - upgradeCost,
      towers: state.towers.map(t =>
        t.id === towerId ? { ...t, level: t.level + 1 } : t
      )
    });

    return true;
  },

  sellTower: (towerId: string) => {
    const state = get();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) return;
    {
      const config = TOWER_CONFIGS[tower.type];
      const sellValue = Math.floor(config.cost * 0.6 * tower.level);
      console.log('[TRACE] 出售塔:', towerId, '获得金币:', sellValue);

      const runesToReturn = tower.runeSlots.filter(r => r !== null) as Rune[];

      set({
        gold: state.gold + sellValue,
        towers: state.towers.filter(t => t.id !== towerId),
        runeInventory: [...state.runeInventory, ...runesToReturn],
        selectedTowerId: null
      });
    }
  },

  embedRune: (towerId: string, slotIndex: number, runeId: string) => {
    const state = get();
    const tower = state.towers.find(t => t.id === towerId);
    const rune = state.runeInventory.find(r => r.id === runeId);

    if (!tower || !rune || slotIndex < 0 || slotIndex > 2) return false;
    if (tower.runeSlots[slotIndex] !== null) return false;

    console.log('[TRACE] 镶嵌符文:', rune.type, '到塔:', towerId, '槽位:', slotIndex);

    const newSlots = [...tower.runeSlots];
    newSlots[slotIndex] = rune;

    set({
      towers: state.towers.map(t =>
        t.id === towerId ? { ...t, runeSlots: newSlots } : t
      ),
      runeInventory: state.runeInventory.filter(r => r.id !== runeId)
    });

    return true;
  },

  removeRune: (towerId: string, slotIndex: number) => {
    const state = get();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower || !tower.runeSlots[slotIndex]) return null;

    const rune = tower.runeSlots[slotIndex]!;
    const newSlots = [...tower.runeSlots];
    newSlots[slotIndex] = null;

    console.log('[TRACE] 移除符文:', rune.type, '从塔:', towerId);

    set({
      towers: state.towers.map(t =>
        t.id === towerId ? { ...t, runeSlots: newSlots } : t
      ),
      runeInventory: [...state.runeInventory, rune]
    });

    return rune;
  },

  spawnEnemy: (type: EnemyType) => {
    const state = get();
    const config = ENEMY_CONFIGS[type];

    const newEnemy: EnemyData = {
      id: uuidv4(),
      type,
      health: config.health,
      maxHealth: config.health,
      x: PATH_POINTS[0].x,
      y: PATH_POINTS[0].y,
      pathIndex: 0,
      slowEffect: 0,
      burnDamage: 0
    };

    console.log('[TRACE] 生成敌人:', type, 'ID:', newEnemy.id);

    set({
      enemies: [...state.enemies, newEnemy]
    });
  },

  damageEnemy: (enemyId: string, damage: number, runes: Rune[] = []) => {
    const state = get();
    const enemy = state.enemies.find(e => e.id === enemyId);
    if (!enemy) return { killed: false, reward: 0 };

    let finalDamage = damage;
    let reward = 0;
    let killed = false;

    const criticalRune = runes.find(r => r.type === 'critical');
    if (criticalRune && Math.random() < 0.2) {
      finalDamage *= criticalRune.effect;
      console.log('[TRACE] 暴击! 伤害:', finalDamage);
    }

    const newHealth = enemy.health - finalDamage;
    const config = ENEMY_CONFIGS[enemy.type];

    let slowEffect = enemy.slowEffect;
    let burnDamage = enemy.burnDamage;

    const slowRune = runes.find(r => r.type === 'slow');
    if (slowRune) {
      slowEffect = Math.max(slowEffect, slowRune.effect);
    }

    const burnRune = runes.find(r => r.type === 'burn');
    if (burnRune) {
      burnDamage = Math.max(burnDamage, burnRune.effect);
    }

    if (newHealth <= 0) {
      killed = true;
      reward = config.reward;
      console.log('[TRACE] 敌人死亡:', enemyId, '奖励:', reward);

      set({
        gold: state.gold + reward,
        score: state.score + reward,
        enemies: state.enemies.filter(e => e.id !== enemyId)
      });
    } else {
      set({
        enemies: state.enemies.map(e =>
          e.id === enemyId
            ? { ...e, health: newHealth, slowEffect, burnDamage }
            : e
        )
      });
    }

    return { killed, reward };
  },

  removeEnemy: (enemyId: string) => {
    set(state => ({
      enemies: state.enemies.filter(e => e.id !== enemyId)
    }));
  },

  enemyReachedEnd: (enemyId: string) => {
    const state = get();
    const newLives = state.lives - 1;
    console.log('[TRACE] 敌人到达终点，生命值:', newLives);

    set({
      lives: newLives,
      enemies: state.enemies.filter(e => e.id !== enemyId),
      gameOver: newLives <= 0
    });
  },

  dropRune: () => {
    const state = get();
    const runeTypes = Object.keys(RUNE_CFG) as RuneType[];
    const roll = Math.random();
    let cumulative = 0;

    for (const type of runeTypes) {
      const config = RUNE_CFG[type];
      cumulative += config.dropChance;
      if (roll < cumulative) {
        const newRune: Rune = {
          id: uuidv4(),
          type,
          name: config.name,
          description: config.description,
          color: config.color,
          effect: config.effect
        };
        console.log('[TRACE] 掉落符文:', type);
        set({
          runeInventory: [...state.runeInventory, newRune]
        });
        return newRune;
      }
    }
    return null;
  },

  setSelectedTowerType: (type: TowerType | null) => {
    set({ selectedTowerType: type, selectedTowerId: null });
  },

  setSelectedTowerId: (id: string | null) => {
    set({ selectedTowerId: id, selectedTowerType: null });
  },

  startWave: () => {
    const state = get();
    if (state.isWaveActive) return;
    console.log('[TRACE] 开始波次:', state.wave + 1);
    set({ wave: state.wave + 1, isWaveActive: true });
  },

  togglePause: () => {
    set(state => ({ isPaused: !state.isPaused }));
  },

  resetGame: () => {
    console.log('[TRACE] 重置游戏');
    set(initialState);
  },

  loadGame: async () => {
    try {
      const saved = await get('aethergrid_save');
      if (saved) {
        console.log('[TRACE] 加载存档');
        set(saved as any);
      }
    } catch (e) {
      console.error('[TRACE] 加载存档失败:', e);
    }
  },

  saveGame: async () => {
    try {
      const state = get();
      const saveData = {
        gold: state.gold,
        lives: state.lives,
        wave: state.wave,
        towers: state.towers,
        runeInventory: state.runeInventory,
        score: state.score
      };
      await set('aethergrid_save', saveData as any);
      console.log('[TRACE] 保存存档');
    } catch (e) {
      console.error('[TRACE] 保存存档失败:', e);
    }
  }
}));
