import { create } from 'zustand';
import type {
  GameState,
  Player,
  MapData,
  CombatState,
  CombatLogEntry,
  Monster,
  Skill,
  Item,
  PlayerStats,
  Buff,
  Position,
  GamePhase,
} from '../types';

const createInitialPlayer = (): Player => ({
  position: { x: 0, y: 0 },
  stats: {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attack: 15,
    defense: 5,
    critRate: 0.15,
    dodgeRate: 0.10,
    level: 1,
    exp: 0,
    expToNext: 100,
    gold: 0,
  },
  skills: [
    {
      id: 'fireball',
      name: '火球术',
      description: '发射火球造成高额伤害',
      damage: 40,
      manaCost: 15,
      cooldown: 5,
      currentCooldown: 0,
      type: 'damage',
      color: '#ff6b35',
      icon: '🔥',
    },
    {
      id: 'frost_nova',
      name: '冰霜新星',
      description: '对敌人造成冰霜伤害并减速',
      damage: 25,
      manaCost: 20,
      cooldown: 5,
      currentCooldown: 0,
      type: 'aoe',
      color: '#4ecdc4',
      icon: '❄️',
    },
    {
      id: 'heal_wave',
      name: '治疗波',
      description: '恢复自身生命值',
      damage: -45,
      manaCost: 25,
      cooldown: 5,
      currentCooldown: 0,
      type: 'heal',
      color: '#2dc653',
      icon: '💚',
    },
    {
      id: 'poison_blade',
      name: '毒刃',
      description: '附加持续中毒伤害',
      damage: 20,
      manaCost: 18,
      cooldown: 5,
      currentCooldown: 0,
      type: 'dot',
      color: '#9b59b6',
      icon: '🗡️',
    },
  ],
  inventory: [],
  equippedWeapon: null,
  equippedArmor: null,
  buffs: [],
});

const createInitialCombat = (): CombatState => ({
  isInCombat: false,
  currentMonster: null,
  combatLogs: [],
  playerTurn: true,
});

const createInitialState = (): GameState => ({
  phase: 'title',
  player: createInitialPlayer(),
  mapData: null,
  combat: createInitialCombat(),
  currentFloor: 1,
  messages: [],
});

export interface GameStore extends GameState {
  setPhase: (phase: GamePhase) => void;
  setPlayer: (player: Player) => void;
  setMapData: (mapData: MapData) => void;
  setCombat: (combat: Partial<CombatState>) => void;
  movePlayer: (position: Position) => void;
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
  addCombatLog: (log: Omit<CombatLogEntry, 'id' | 'timestamp'>) => void;
  clearCombatLogs: () => void;
  startCombat: (monster: Monster) => void;
  endCombat: (victory: boolean) => void;
  updateMonsterHp: (hp: number) => void;
  updateSkillCooldown: (skillId: string, cooldown: number) => void;
  reduceAllSkillCooldowns: () => void;
  addItem: (item: Item) => void;
  equipItem: (item: Item) => void;
  useItem: (itemId: string) => void;
  addBuff: (buff: Buff) => void;
  updateBuffs: () => void;
  addExp: (exp: number) => void;
  removeMapMonster: (monsterId: string) => void;
  removeMapItem: (itemId: string) => void;
  nextFloor: () => void;
  resetGame: () => void;
  updateTileVisibility: (playerPos: Position) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  setPhase: (phase) => set({ phase }),

  setPlayer: (player) => set({ player }),

  setMapData: (mapData) => set({ mapData }),

  setCombat: (combat) =>
    set((state) => ({ combat: { ...state.combat, ...combat } })),

  movePlayer: (position) =>
    set((state) => {
      const newState = { ...state, player: { ...state.player, position } };
      if (newState.mapData) {
        const newTiles = newState.mapData.tiles.map((row) =>
          row.map((tile) => ({ ...tile }))
        );
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const tx = position.x + dx;
            const ty = position.y + dy;
            if (
              tx >= 0 &&
              tx < newState.mapData.width &&
              ty >= 0 &&
              ty < newState.mapData.height
            ) {
              newTiles[ty][tx].visible = true;
              newTiles[ty][tx].explored = true;
            }
          }
        }
        newState.mapData = { ...newState.mapData, tiles: newTiles };
      }
      return newState;
    }),

  updatePlayerStats: (stats) =>
    set((state) => ({
      player: {
        ...state.player,
        stats: { ...state.player.stats, ...stats },
      },
    })),

  addCombatLog: (log) =>
    set((state) => {
      const newLog: CombatLogEntry = {
        ...log,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      };
      const logs = [...state.combat.combatLogs, newLog].slice(-30);
      return { combat: { ...state.combat, combatLogs: logs } };
    }),

  clearCombatLogs: () =>
    set((state) => ({ combat: { ...state.combat, combatLogs: [] } })),

  startCombat: (monster) =>
    set((state) => ({
      phase: 'combat',
      combat: {
        isInCombat: true,
        currentMonster: { ...monster },
        combatLogs: [],
        playerTurn: true,
      },
    })),

  endCombat: (victory) =>
    set((state) => ({
      phase: victory ? 'exploring' : 'defeat',
      combat: {
        ...state.combat,
        isInCombat: false,
        currentMonster: null,
      },
    })),

  updateMonsterHp: (hp) =>
    set((state) => {
      if (!state.combat.currentMonster) return state;
      return {
        combat: {
          ...state.combat,
          currentMonster: {
            ...state.combat.currentMonster,
            hp: Math.max(0, hp),
          },
        },
      };
    }),

  updateSkillCooldown: (skillId, cooldown) =>
    set((state) => ({
      player: {
        ...state.player,
        skills: state.player.skills.map((s) =>
          s.id === skillId ? { ...s, currentCooldown: cooldown } : s
        ),
      },
    })),

  reduceAllSkillCooldowns: () =>
    set((state) => ({
      player: {
        ...state.player,
        skills: state.player.skills.map((s) => ({
          ...s,
          currentCooldown: Math.max(0, s.currentCooldown - 1),
        })),
      },
    })),

  addItem: (item) =>
    set((state) => ({
      player: {
        ...state.player,
        inventory: [...state.player.inventory, item],
      },
    })),

  equipItem: (item) =>
    set((state) => {
      const player = { ...state.player };
      let stats = { ...player.stats };

      if (player.equippedWeapon) {
        stats.attack -= player.equippedWeapon.attack || 0;
      }
      if (player.equippedArmor) {
        stats.defense -= player.equippedArmor.defense || 0;
      }

      if (item.type === 'weapon') {
        player.equippedWeapon = item;
        player.inventory = player.inventory.filter((i) => i.id !== item.id);
        stats.attack += item.attack || 0;
      } else if (item.type === 'armor') {
        player.equippedArmor = item;
        player.inventory = player.inventory.filter((i) => i.id !== item.id);
        stats.defense += item.defense || 0;
      }

      player.stats = stats;
      return { player };
    }),

  useItem: (itemId) =>
    set((state) => {
      const item = state.player.inventory.find((i) => i.id === itemId);
      if (!item || item.type !== 'potion') return state;

      const stats = { ...state.player.stats };
      if (item.hpRestore) {
        stats.hp = Math.min(stats.maxHp, stats.hp + item.hpRestore);
      }
      if (item.manaRestore) {
        stats.mp = Math.min(stats.maxMp, stats.mp + item.manaRestore);
      }

      return {
        player: {
          ...state.player,
          stats,
          inventory: state.player.inventory.filter((i) => i.id !== itemId),
        },
      };
    }),

  addBuff: (buff) =>
    set((state) => ({
      player: {
        ...state.player,
        buffs: [...state.player.buffs.filter((b) => b.type !== buff.type), buff],
      },
    })),

  updateBuffs: () =>
    set((state) => {
      const buffs = state.player.buffs
        .map((b) => ({ ...b, duration: b.duration - 1 }))
        .filter((b) => b.duration > 0);
      return { player: { ...state.player, buffs } };
    }),

  addExp: (exp) =>
    set((state) => {
      let stats = { ...state.player.stats };
      stats.exp += exp;

      while (stats.exp >= stats.expToNext) {
        stats.exp -= stats.expToNext;
        stats.level += 1;
        stats.maxHp += 20;
        stats.hp = stats.maxHp;
        stats.maxMp += 10;
        stats.mp = stats.maxMp;
        stats.attack += 3;
        stats.defense += 2;
        stats.expToNext = Math.floor(stats.expToNext * 1.5);
      }

      return { player: { ...state.player, stats } };
    }),

  removeMapMonster: (monsterId) =>
    set((state) => {
      if (!state.mapData) return state;
      return {
        mapData: {
          ...state.mapData,
          monsters: state.mapData.monsters.filter((m) => m.id !== monsterId),
        },
      };
    }),

  removeMapItem: (itemId) =>
    set((state) => {
      if (!state.mapData) return state;
      return {
        mapData: {
          ...state.mapData,
          items: state.mapData.items.filter((i) => i.id !== itemId),
        },
      };
    }),

  nextFloor: () =>
    set((state) => ({
      currentFloor: state.currentFloor + 1,
      mapData: null,
      combat: createInitialCombat(),
    })),

  resetGame: () => set(createInitialState()),

  updateTileVisibility: (playerPos) =>
    set((state) => {
      if (!state.mapData) return state;
      const newTiles = state.mapData.tiles.map((row) =>
        row.map((tile) => ({ ...tile, visible: false }))
      );
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = playerPos.x + dx;
          const ty = playerPos.y + dy;
          if (
            tx >= 0 &&
            tx < state.mapData.width &&
            ty >= 0 &&
            ty < state.mapData.height
          ) {
            newTiles[ty][tx].visible = true;
            newTiles[ty][tx].explored = true;
          }
        }
      }
      return { mapData: { ...state.mapData, tiles: newTiles } };
    }),
}));
