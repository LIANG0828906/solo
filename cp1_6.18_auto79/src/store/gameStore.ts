import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Unit, UnitType, Team, BattleLogEntry, GamePhase, Settings, HexCoord, ReplayStep } from '../types';
import { isPlayerDeployZone, isAIDeployZone, GRID_ROWS, GRID_COLS } from '../engine/grid';

const defaultSettings: Settings = {
  aiRandomFactor: 50,
  warriorStats: { hp: 5, attack: 3, move: 2, range: 1 },
  archerStats: { hp: 3, attack: 2, move: 3, range: 3 },
  cavalryStats: { hp: 4, attack: 4, move: 4, range: 1 },
};

interface GameState {
  phase: GamePhase;
  units: Unit[];
  currentTurn: Team;
  turnNumber: number;
  selectedUnitId: string | null;
  logs: BattleLogEntry[];
  settings: Settings;
  winner: Team | null;
  replaySteps: ReplayStep[];
  isReplaying: boolean;
  replayIndex: number;
  deployableUnits: { type: UnitType; count: number }[];
  deployingUnitType: UnitType | null;
  animatingUnitId: string | null;
  damagePopup: { unitId: string; damage: number; id: string } | null;
  setSelectedUnit: (id: string | null) => void;
  setDeployingUnitType: (type: UnitType | null) => void;
  deployUnit: (type: UnitType, col: number, row: number, team: Team) => boolean;
  removeUnit: (id: string) => void;
  moveUnit: (id: string, col: number, row: number) => void;
  attackUnit: (attackerId: string, targetId: string) => number;
  addLog: (team: Team, message: string) => void;
  setPhase: (phase: GamePhase) => void;
  nextTurn: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  checkGameEnd: () => boolean;
  setWinner: (winner: Team) => void;
  saveReplayStep: (log: BattleLogEntry, animationType?: 'move' | 'attack' | 'damage', targetCoord?: HexCoord) => void;
  startReplay: () => void;
  stopReplay: () => void;
  setReplayIndex: (index: number) => void;
  resetGame: () => void;
  markUnitMoved: (id: string) => void;
  markUnitAttacked: (id: string) => void;
  setAnimatingUnit: (id: string | null) => void;
  setDamagePopup: (popup: { unitId: string; damage: number; id: string } | null) => void;
  deployAIUnits: () => void;
}

const getInitialDeployableUnits = () => [
  { type: 'warrior' as UnitType, count: 4 },
  { type: 'archer' as UnitType, count: 4 },
  { type: 'cavalry' as UnitType, count: 4 },
];

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'deploy',
  units: [],
  currentTurn: 'player',
  turnNumber: 1,
  selectedUnitId: null,
  logs: [],
  settings: defaultSettings,
  winner: null,
  replaySteps: [],
  isReplaying: false,
  replayIndex: -1,
  deployableUnits: getInitialDeployableUnits(),
  deployingUnitType: null,
  animatingUnitId: null,
  damagePopup: null,

  setSelectedUnit: (id) => set({ selectedUnitId: id }),

  setDeployingUnitType: (type) => set({ deployingUnitType: type }),

  deployUnit: (type, col, row, team) => {
    const state = get();
    if (team === 'player' && !isPlayerDeployZone(col, row)) return false;
    if (team === 'ai' && !isAIDeployZone(col, row)) return false;

    const occupied = state.units.some(u => u.col === col && u.row === row && u.hp > 0);
    if (occupied) return false;

    if (team === 'player') {
      const deployable = state.deployableUnits.find(d => d.type === type);
      if (!deployable || deployable.count <= 0) return false;
      const playerUnits = state.units.filter(u => u.team === 'player').length;
      if (playerUnits >= 4) return false;
    }

    const stats = type === 'warrior' ? state.settings.warriorStats
      : type === 'archer' ? state.settings.archerStats
      : state.settings.cavalryStats;

    const newUnit: Unit = {
      id: uuidv4(),
      type,
      team,
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      move: stats.move,
      range: stats.range,
      col,
      row,
      hasMoved: false,
      hasAttacked: false,
    };

    if (team === 'player') {
      const newDeployable = state.deployableUnits.map(d =>
        d.type === type ? { ...d, count: d.count - 1 } : d
      );
      set({ units: [...state.units, newUnit], deployableUnits: newDeployable });
    } else {
      set({ units: [...state.units, newUnit] });
    }

    return true;
  },

  removeUnit: (id) => {
    const state = get();
    const unit = state.units.find(u => u.id === id);
    if (!unit || unit.team !== 'player' || state.phase !== 'deploy') return;

    const newDeployable = state.deployableUnits.map(d =>
      d.type === unit.type ? { ...d, count: d.count + 1 } : d
    );
    set({
      units: state.units.filter(u => u.id !== id),
      deployableUnits: newDeployable,
      selectedUnitId: state.selectedUnitId === id ? null : state.selectedUnitId,
    });
  },

  moveUnit: (id, col, row) => {
    set(state => ({
      units: state.units.map(u =>
        u.id === id ? { ...u, col, row, hasMoved: true } : u
      ),
    }));
  },

  attackUnit: (attackerId, targetId) => {
    const state = get();
    const attacker = state.units.find(u => u.id === attackerId);
    const target = state.units.find(u => u.id === targetId);
    if (!attacker || !target) return 0;

    const damage = attacker.attack;
    const newHp = Math.max(0, target.hp - damage);

    set({
      units: state.units.map(u => {
        if (u.id === targetId) return { ...u, hp: newHp };
        if (u.id === attackerId) return { ...u, hasAttacked: true };
        return u;
      }),
    });

    return damage;
  },

  addLog: (team, message) => {
    const state = get();
    const entry: BattleLogEntry = {
      id: uuidv4(),
      turn: state.turnNumber,
      team,
      message,
      timestamp: Date.now(),
    };
    set({ logs: [...state.logs, entry] });
  },

  setPhase: (phase) => set({ phase }),

  nextTurn: () => {
    set(state => {
      const nextTeam: Team = state.currentTurn === 'player' ? 'ai' : 'player';
      const newTurnNumber = nextTeam === 'player' ? state.turnNumber + 1 : state.turnNumber;

      const resetUnits = state.units.map(u =>
        u.team === nextTeam ? { ...u, hasMoved: false, hasAttacked: false } : u
      );

      return {
        currentTurn: nextTeam,
        turnNumber: newTurnNumber,
        units: resetUnits,
        selectedUnitId: null,
      };
    });
  },

  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  checkGameEnd: () => {
    const state = get();
    const playerAlive = state.units.some(u => u.team === 'player' && u.hp > 0);
    const aiAlive = state.units.some(u => u.team === 'ai' && u.hp > 0);

    if (!playerAlive) {
      set({ winner: 'ai', phase: 'ended' });
      return true;
    }
    if (!aiAlive) {
      set({ winner: 'player', phase: 'ended' });
      return true;
    }
    return false;
  },

  setWinner: (winner) => set({ winner, phase: 'ended' }),

  saveReplayStep: (log, animationType, targetCoord) => {
    const state = get();
    const step: ReplayStep = {
      units: JSON.parse(JSON.stringify(state.units)),
      currentTurn: state.currentTurn,
      turnNumber: state.turnNumber,
      log,
      animationType,
      targetCoord,
    };
    set({ replaySteps: [...state.replaySteps, step] });
  },

  startReplay: () => {
    const state = get();
    if (state.replaySteps.length === 0) return;

    const firstStep = state.replaySteps[0];
    set({
      isReplaying: true,
      replayIndex: 0,
      units: JSON.parse(JSON.stringify(firstStep.units)),
      currentTurn: firstStep.currentTurn,
      turnNumber: firstStep.turnNumber,
      selectedUnitId: null,
      phase: 'battle',
      winner: null,
    });
  },

  stopReplay: () => set({ isReplaying: false, replayIndex: -1 }),

  setReplayIndex: (index) => {
    const state = get();
    if (index < 0 || index >= state.replaySteps.length) return;
    const step = state.replaySteps[index];
    set({
      replayIndex: index,
      units: JSON.parse(JSON.stringify(step.units)),
      currentTurn: step.currentTurn,
      turnNumber: step.turnNumber,
    });
  },

  resetGame: () => {
    set({
      phase: 'deploy',
      units: [],
      currentTurn: 'player',
      turnNumber: 1,
      selectedUnitId: null,
      logs: [],
      winner: null,
      isReplaying: false,
      replayIndex: -1,
      deployableUnits: getInitialDeployableUnits(),
      deployingUnitType: null,
      animatingUnitId: null,
      damagePopup: null,
    });
  },

  markUnitMoved: (id) => {
    set(state => ({
      units: state.units.map(u => u.id === id ? { ...u, hasMoved: true } : u),
    }));
  },

  markUnitAttacked: (id) => {
    set(state => ({
      units: state.units.map(u => u.id === id ? { ...u, hasAttacked: true } : u),
    }));
  },

  setAnimatingUnit: (id) => set({ animatingUnitId: id }),

  setDamagePopup: (popup) => set({ damagePopup: popup }),

  deployAIUnits: () => {
    const state = get();
    const { settings } = state;

    const aiUnitTypes: { type: UnitType; count: number }[] = [
      { type: 'warrior', count: 2 },
      { type: 'archer', count: 1 },
      { type: 'cavalry', count: 1 },
    ];

    const availablePositions: HexCoord[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = GRID_COLS - 2; col < GRID_COLS; col++) {
        availablePositions.push({ col, row });
      }
    }

    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }

    let posIndex = 0;
    for (const unitGroup of aiUnitTypes) {
      for (let i = 0; i < unitGroup.count; i++) {
        if (posIndex >= availablePositions.length) break;
        const pos = availablePositions[posIndex++];
        const type = unitGroup.type;
        const stats = type === 'warrior' ? settings.warriorStats
          : type === 'archer' ? settings.archerStats
          : settings.cavalryStats;

        const newUnit: Unit = {
          id: uuidv4(),
          type,
          team: 'ai',
          hp: stats.hp,
          maxHp: stats.hp,
          attack: stats.attack,
          move: stats.move,
          range: stats.range,
          col: pos.col,
          row: pos.row,
          hasMoved: false,
          hasAttacked: false,
        };
        set(state => ({ units: [...state.units, newUnit] }));
      }
    }
  },
}));
