import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { set, get, keys, del } from 'idb-keyval';
import {
  Resources,
  Ship,
  ShipType,
  BattleState,
  BattleLogEntry,
  SaveSlot,
  MAX_FORMATION_SLOTS,
  BattleStats,
  BuildResultCode
} from '../engine/types';
import {
  buildShip as buildShipLogic,
  addShipToFormation as addShipToFormationLogic,
  removeShipFromFormation as removeShipToFormationLogic,
  reorderFormation as reorderFormationLogic,
  getActiveFormationShips,
  restoreEnergyByPercent,
  regenerateResources,
  canAfford
} from '../engine/fleetManager';
import {
  setupBattleGrid,
  generateEnemyWave,
  performAttack,
  executeAITurn,
  isBattleEnded
} from '../engine/battleEngine';

interface GameState {
  resources: Resources;
  availableShips: Ship[];
  formationSlots: (Ship | null)[];
  battleState: BattleState | null;
  battleStats: BattleStats | null;
  waveNumber: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  saveSlots: SaveSlot[];
  currentMessage: string | null;

  setMessage: (msg: string | null) => void;
  canBuildShip: (type: ShipType) => BuildResultCode;
  buildShip: (type: ShipType) => void;
  addShipToFormation: (shipId: string, slotIndex?: number) => void;
  removeShipFromFormation: (slotIndex: number) => void;
  reorderFormation: (fromIndex: number, toIndex: number) => void;
  regenerateResourcesTick: () => void;

  startBattle: () => void;
  selectShip: (shipId: string | null) => void;
  playerAttack: (attackerId: string, targetId: string) => void;
  endPlayerTurn: () => void;
  proceedToNextWave: () => void;
  endBattle: () => void;

  saveGame: () => Promise<void>;
  loadGame: (saveId: string) => Promise<void>;
  loadSaveSlots: () => Promise<void>;
}

const INITIAL_RESOURCES: Resources = { iron: 100, crystal: 100, energy: 100 };
const INITIAL_FORMATION: (Ship | null)[] = Array(MAX_FORMATION_SLOTS).fill(null);

export const useGameStore = create<GameState>((set, get) => ({
  resources: INITIAL_RESOURCES,
  availableShips: [],
  formationSlots: INITIAL_FORMATION,
  battleState: null,
  battleStats: null,
  waveNumber: 1,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  saveSlots: [],
  currentMessage: null,

  setMessage: (msg) => set({ currentMessage: msg }),

  canBuildShip: (type) => {
    const state = get();
    const config = {
      fighter: { cost: { iron: 15, crystal: 10, energy: 5 } },
      corvette: { cost: { iron: 30, crystal: 20, energy: 15 } },
      destroyer: { cost: { iron: 50, crystal: 35, energy: 25 } },
      cruiser: { cost: { iron: 80, crystal: 60, energy: 45 } }
    }[type];
    if (!config) return 'ERR_INSUFFICIENT_RESOURCES' as BuildResultCode;
    return canAfford(state.resources, config.cost).code;
  },

  buildShip: (type) => {
    const state = get();
    const result = buildShipLogic(type, state.resources);
    if (result.success && result.newShip) {
      set({
        resources: result.newResources,
        availableShips: [...state.availableShips, result.newShip],
        currentMessage: result.message
      });
    } else {
      set({ currentMessage: result.message });
    }
  },

  addShipToFormation: (shipId, slotIndex) => {
    const state = get();
    const ship = state.availableShips.find(s => s.id === shipId);
    if (!ship) {
      set({ currentMessage: '未找到该飞船' });
      return;
    }
    const result = addShipToFormationLogic(state.formationSlots, ship, slotIndex);
    if (result.success) {
      set({
        formationSlots: result.newFormation,
        availableShips: state.availableShips.filter(s => s.id !== shipId),
        currentMessage: result.message
      });
    } else {
      set({ currentMessage: result.message });
    }
  },

  removeShipFromFormation: (slotIndex) => {
    const state = get();
    const ship = state.formationSlots[slotIndex];
    if (!ship) return;
    const newFormation = removeShipFromFormationLogic(state.formationSlots, slotIndex);
    set({
      formationSlots: newFormation,
      availableShips: [...state.availableShips, ship]
    });
  },

  reorderFormation: (fromIndex, toIndex) => {
    const state = get();
    const newFormation = reorderFormationLogic(state.formationSlots, fromIndex, toIndex);
    set({ formationSlots: newFormation });
  },

  regenerateResourcesTick: () => {
    const state = get();
    set({ resources: regenerateResources(state.resources, 1) });
  },

  startBattle: () => {
    const state = get();
    const playerShips = getActiveFormationShips(state.formationSlots);
    if (playerShips.length === 0) {
      set({ currentMessage: '编队中没有飞船，无法开始战斗！' });
      return;
    }
    const enemyShips = generateEnemyWave(state.waveNumber);
    const battleState = setupBattleGrid(playerShips, enemyShips, state.waveNumber);
    set({
      battleState,
      battleStats: {
        enemiesDestroyed: 0,
        shipsLost: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        duration: 0,
        startTimestamp: Date.now()
      },
      totalDamageDealt: 0,
      totalDamageTaken: 0
    });
  },

  selectShip: (shipId) => {
    const state = get();
    if (!state.battleState) return;
    set({
      battleState: {
        ...state.battleState,
        selectedShipId: shipId,
        turnPhase: shipId ? 'target' : 'select'
      }
    });
  },

  playerAttack: (attackerId, targetId) => {
    const state = get();
    if (!state.battleState) return;

    const newBattleState = JSON.parse(JSON.stringify(state.battleState)) as BattleState;
    const attacker = newBattleState.playerShips.find(s => s.id === attackerId);
    const target = newBattleState.enemyShips.find(s => s.id === targetId);

    if (!attacker || !target || attacker.stats.hp <= 0 || target.stats.hp <= 0) return;
    if (attacker.hasActed) return;

    const { log, targetKilled, animation } = performAttack(attacker, target, newBattleState.currentTurn);
    attacker.hasActed = true;
    newBattleState.log.push(log);
    newBattleState.attackAnimations = [...(newBattleState.attackAnimations || []), animation];

    if (targetKilled) {
      const { x, y } = target.position;
      newBattleState.grid[y][x] = null;
    }

    const attackerIdx = newBattleState.playerShips.findIndex(s => s.id === attackerId);
    if (attackerIdx !== -1) newBattleState.playerShips[attackerIdx] = attacker;
    const targetIdx = newBattleState.enemyShips.findIndex(s => s.id === targetId);
    if (targetIdx !== -1) newBattleState.enemyShips[targetIdx] = target;

    newBattleState.selectedShipId = null;
    newBattleState.turnPhase = 'select';

    const newTotalDamageDealt = state.totalDamageDealt + log.damage;

    const winner = isBattleEnded(newBattleState);
    if (winner === 'player') {
      newBattleState.phase = 'ended';
      newBattleState.isResting = true;
    } else if (winner === 'enemy') {
      newBattleState.phase = 'ended';
    }

    const stats = state.battleStats;
    const newStats = stats ? {
      ...stats,
      enemiesDestroyed: stats.enemiesDestroyed + (targetKilled ? 1 : 0),
      totalDamageDealt: stats.totalDamageDealt + log.damage,
      duration: Math.floor((Date.now() - stats.startTimestamp) / 1000)
    } : null;

    set({
      battleState: newBattleState,
      battleStats: newStats,
      totalDamageDealt: newTotalDamageDealt
    });
  },

  endPlayerTurn: () => {
    const state = get();
    if (!state.battleState || state.battleState.phase !== 'player') return;

    set({
      battleState: {
        ...state.battleState,
        phase: 'enemy',
        turnPhase: 'animating'
      }
    });

    setTimeout(() => {
      const currentState = get();
      if (!currentState.battleState) return;

      const { newState, logs, animations, playerKilledIds, totalDamage } = executeAITurn(currentState.battleState);
      newState.log.push(...logs);
      newState.attackAnimations = [...(newState.attackAnimations || []), ...animations];
      newState.currentTurn += 1;
      newState.phase = 'player';
      newState.turnPhase = 'select';
      newState.playerShips.forEach(s => s.hasActed = false);

      const newTotalDamageTaken = currentState.totalDamageTaken + totalDamage;

      const winner = isBattleEnded(newState);
      if (winner === 'player') {
        newState.phase = 'ended';
        newState.isResting = true;
      } else if (winner === 'enemy') {
        newState.phase = 'ended';
      }

      const stats = currentState.battleStats;
      const newStats = stats ? {
        ...stats,
        shipsLost: stats.shipsLost + playerKilledIds.length,
        totalDamageTaken: stats.totalDamageTaken + totalDamage,
        duration: Math.floor((Date.now() - stats.startTimestamp) / 1000)
      } : null;

      set({
        battleState: newState,
        battleStats: newStats,
        totalDamageTaken: newTotalDamageTaken
      });
    }, 800);
  },

  proceedToNextWave: () => {
    const state = get();
    const newResources = restoreEnergyByPercent(state.resources, 20);
    const newWave = state.waveNumber + 1;

    const playerShips = state.battleState?.playerShips.filter(s => s.stats.hp > 0) || [];
    playerShips.forEach(s => {
      s.stats.shield.value = s.stats.shield.maxValue;
    });

    const newFormation: (Ship | null)[] = Array(MAX_FORMATION_SLOTS).fill(null);
    playerShips.forEach((ship, i) => {
      if (i < MAX_FORMATION_SLOTS) newFormation[i] = ship;
    });

    const availableOutside = state.formationSlots
      .filter((s): s is Ship => s !== null && !playerShips.find(ps => ps.id === s.id))
      .concat(state.availableShips);

    set({
      resources: newResources,
      waveNumber: newWave,
      battleState: null,
      battleStats: null,
      formationSlots: newFormation,
      availableShips: availableOutside
    });
  },

  endBattle: () => {
    set({
      battleState: null,
      battleStats: null
    });
  },

  saveGame: async () => {
    const state = get();
    const saveId = uuidv4();
    const timestamp = Date.now();
    const saveData = {
      resources: state.resources,
      availableShips: state.availableShips,
      formationSlots: state.formationSlots,
      battleState: state.battleState,
      battleStats: state.battleStats,
      waveNumber: state.waveNumber,
      totalDamageDealt: state.totalDamageDealt,
      totalDamageTaken: state.totalDamageTaken,
      saveInfo: {
        id: saveId,
        timestamp,
        waveNumber: state.waveNumber,
        playerName: '指挥官'
      }
    };

    await set(saveId, saveData);

    const allKeys = await keys();
    const maxSlots = 3;
    const saveKeys: IDBValidKey[] = [];
    for (const k of allKeys) {
      const data = await get<string, any>(k);
      if (data?.saveInfo) {
        saveKeys.push(k);
      }
    }
    if (saveKeys.length > maxSlots) {
      saveKeys.sort((a, b) => {
        const da = saveKeys.indexOf(a);
        const db = saveKeys.indexOf(b);
        return da - db;
      });
      const toDelete = saveKeys.slice(0, saveKeys.length - maxSlots);
      for (const k of toDelete) {
        await del(k);
      }
    }

    await get().loadSaveSlots();
    set({ currentMessage: '游戏已保存！' });
  },

  loadGame: async (saveId) => {
    const saveData = await get<string, any>(saveId);
    if (saveData) {
      set({
        resources: saveData.resources,
        availableShips: saveData.availableShips || [],
        formationSlots: saveData.formationSlots || Array(MAX_FORMATION_SLOTS).fill(null),
        battleState: saveData.battleState || null,
        battleStats: saveData.battleStats || null,
        waveNumber: saveData.waveNumber || 1,
        totalDamageDealt: saveData.totalDamageDealt || 0,
        totalDamageTaken: saveData.totalDamageTaken || 0,
        currentMessage: '游戏已加载！'
      });
    }
  },

  loadSaveSlots: async () => {
    const allKeys = await keys();
    const slots: SaveSlot[] = [];
    for (const k of allKeys) {
      const data = await get<string, any>(k);
      if (data?.saveInfo) {
        slots.push(data.saveInfo);
      }
    }
    slots.sort((a, b) => b.timestamp - a.timestamp);
    set({ saveSlots: slots.slice(0, 3) });
  }
}));
