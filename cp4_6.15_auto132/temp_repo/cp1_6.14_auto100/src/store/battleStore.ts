import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Unit,
  GridPosition,
  TerrainType,
  BattleLogEntry,
  TurnState,
  UnitStats,
  UnitClass,
} from '../modules/battle/types';
import { GridSystem } from '../modules/grid/GridSystem';
import { BattleEngine } from '../modules/battle/BattleEngine';

interface BattleState {
  units: Unit[];
  gridSystem: GridSystem;
  battleEngine: BattleEngine;
  turn: TurnState;
  selectedUnitId: string | null;
  battleLog: BattleLogEntry[];
  movableCells: GridPosition[];
  attackablePositions: GridPosition[];
  isAnimating: boolean;
  contextMenuPos: { x: number; y: number; position: GridPosition } | null;
  placeMode: UnitClass | null;

  setSelectedUnit: (unitId: string | null) => void;
  addUnit: (unitClass: UnitClass, position: GridPosition, isPlayer: boolean) => void;
  removeUnit: (unitId: string) => void;
  updateUnitStats: (unitId: string, stats: Partial<UnitStats>) => void;
  setTerrain: (position: GridPosition, terrain: TerrainType) => void;
  startNewTurn: () => void;
  selectCurrentUnit: () => void;
  moveUnit: (unitId: string, targetPos: GridPosition) => void;
  attackUnit: (attackerId: string, targetId: string) => void;
  nextUnitTurn: () => void;
  addLogEntry: (message: string, type: BattleLogEntry['type']) => void;
  clearBattleLog: () => void;
  exportBattleLog: () => string;
  setContextMenu: (menu: { x: number; y: number; position: GridPosition } | null) => void;
  setPlaceMode: (unitClass: UnitClass | null) => void;
  setIsAnimating: (animating: boolean) => void;
  initializeDemoUnits: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => {
  const gridSystem = new GridSystem(8);
  const battleEngine = new BattleEngine(gridSystem);

  return {
    units: [],
    gridSystem,
    battleEngine,
    turn: {
      currentUnitIndex: 0,
      turnOrder: [],
      phase: 'idle',
      turnNumber: 0,
    },
    selectedUnitId: null,
    battleLog: [],
    movableCells: [],
    attackablePositions: [],
    isAnimating: false,
    contextMenuPos: null,
    placeMode: null,

    setSelectedUnit: (unitId) => {
      const { units } = get();
      if (!unitId) {
        set({ selectedUnitId: null, movableCells: [], attackablePositions: [] });
        return;
      }

      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      const { battleEngine: engine } = get();

      const movable = engine.calculateMoveRange(unit, units);
      const attackable = engine.getAttackablePositions(unit, units);

      set({
        selectedUnitId: unitId,
        movableCells: movable,
        attackablePositions: attackable,
      });
    },

    addUnit: (unitClass, position, isPlayer) => {
      const { battleEngine: engine, units } = get();
      const classNames: Record<UnitClass, string> = isPlayer
        ? { warrior: '战士', mage: '法师', archer: '弓箭手' }
        : { warrior: '敌方战士', mage: '敌方法师', archer: '敌方弓箭手' };
      const count = units.filter((u) => u.unitClass === unitClass && u.isPlayer === isPlayer).length;
      const name = `${classNames[unitClass]}${String.fromCharCode(65 + count)}`;

      const newUnit = engine.createUnit(unitClass, position, isPlayer, name);
      const newUnits = [...units, newUnit];

      set({ units: newUnits });

      const { turn } = get();
      if (turn.phase !== 'idle') {
        const newOrder = engine.calculateTurnOrder(newUnits);
        set({
          turn: { ...turn, turnOrder: newOrder },
        });
      }

      get().addLogEntry(`${name}加入战场`, 'info');
    },

    removeUnit: (unitId) => {
      const { units, turn, selectedUnitId } = get();
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      const newUnits = units.filter((u) => u.id !== unitId);
      const newOrder = turn.turnOrder.filter((id) => id !== unitId);
      let newIndex = turn.currentUnitIndex;
      if (turn.turnOrder[turn.currentUnitIndex] === unitId) {
        newIndex = Math.min(newIndex, newOrder.length - 1);
      }

      set({
        units: newUnits,
        turn: { ...turn, turnOrder: newOrder, currentUnitIndex: Math.max(0, newIndex) },
        selectedUnitId: selectedUnitId === unitId ? null : selectedUnitId,
      });

      get().addLogEntry(`${unit.name}被移除`, 'info');
    },

    updateUnitStats: (unitId, stats) => {
      const { units, battleEngine: engine, turn } = get();
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      const updatedUnit = engine.updateUnitStats(unit, stats);
      const newUnits = units.map((u) => (u.id === unitId ? updatedUnit : u));

      const newOrder = engine.calculateTurnOrder(newUnits);

      set({
        units: newUnits,
        turn: { ...turn, turnOrder: newOrder },
      });
    },

    setTerrain: (position, terrain) => {
      const { gridSystem: grid } = get();
      grid.setTerrain(position, terrain);
      set({ gridSystem: grid });
    },

    startNewTurn: () => {
      const { units, battleEngine: engine, turn } = get();
      const resetUnits = engine.resetUnitsForNewTurn(units);
      const order = engine.calculateTurnOrder(resetUnits);

      set({
        units: resetUnits,
        turn: {
          currentUnitIndex: 0,
          turnOrder: order,
          phase: 'selecting',
          turnNumber: turn.turnNumber + 1,
        },
        selectedUnitId: null,
        movableCells: [],
        attackablePositions: [],
      });

      get().addLogEntry(`第${turn.turnNumber + 1}回合开始`, 'info');
    },

    selectCurrentUnit: () => {
      const { turn, units } = get();
      if (turn.phase !== 'selecting') return;

      const currentUnitId = turn.turnOrder[turn.currentUnitIndex];
      if (!currentUnitId) return;

      const unit = units.find((u) => u.id === currentUnitId);
      if (!unit || unit.currentHp <= 0) {
        get().nextUnitTurn();
        return;
      }

      const { battleEngine: engine } = get();
      const movable = engine.calculateMoveRange(unit, units);
      const attackable = engine.getAttackablePositions(unit, units);

      set({
        selectedUnitId: currentUnitId,
        movableCells: movable,
        attackablePositions: attackable,
        turn: { ...turn, phase: 'moving' },
      });
    },

    moveUnit: (unitId, targetPos) => {
      const { units, battleEngine: engine, turn } = get();
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      const movedUnit = engine.moveUnit(unit, targetPos);
      const newUnits = units.map((u) => (u.id === unitId ? movedUnit : u));

      const attackable = engine.getAttackablePositions(movedUnit, newUnits);

      set({
        units: newUnits,
        movableCells: [],
        attackablePositions: attackable,
        turn: { ...turn, phase: 'attacking' },
      });

      get().addLogEntry(
        `${unit.name}移动到(${targetPos.q},${targetPos.r})`,
        'move'
      );
    },

    attackUnit: (attackerId, targetId) => {
      const { units, battleEngine: engine, gridSystem: grid, turn } = get();
      const attacker = units.find((u) => u.id === attackerId);
      const target = units.find((u) => u.id === targetId);
      if (!attacker || !target) return;

      const terrain = grid.getTerrain(target.position);
      const result = engine.calculateDamage(attacker, target, terrain);
      const damagedTarget = engine.applyDamage(target, result.damage);

      const newUnits = units.map((u) =>
        u.id === targetId ? damagedTarget : u
      );

      const critText = result.isCritical ? '暴击！' : '';
      get().addLogEntry(
        `${attacker.name}对${target.name}造成${result.damage}点伤害${critText}`,
        'attack'
      );

      if (result.targetDied) {
        get().addLogEntry(`${target.name}被击败！`, 'death');
      }

      const finalUnits = newUnits.map((u) =>
        u.id === attackerId ? { ...u, hasActed: true } : u
      );

      set({
        units: finalUnits,
        attackablePositions: [],
        selectedUnitId: null,
      });

      setTimeout(() => {
        get().nextUnitTurn();
      }, 800);
    },

    nextUnitTurn: () => {
      const { turn, units, battleEngine: engine } = get();
      let nextIndex = turn.currentUnitIndex + 1;

      while (
        nextIndex < turn.turnOrder.length
      ) {
        const unit = units.find((u) => u.id === turn.turnOrder[nextIndex]);
        if (unit && unit.currentHp > 0) {
          break;
        }
        nextIndex++;
      }

      if (nextIndex >= turn.turnOrder.length) {
        if (engine.isBattleEnded(units)) {
          set({
            turn: { ...turn, phase: 'ended' },
            selectedUnitId: null,
            movableCells: [],
            attackablePositions: [],
          });
          get().addLogEntry('战斗结束！', 'info');
        } else {
          get().startNewTurn();
        }
      } else {
        set({
          turn: { ...turn, currentUnitIndex: nextIndex, phase: 'selecting' },
          selectedUnitId: null,
          movableCells: [],
          attackablePositions: [],
        });
      }
    },

    addLogEntry: (message, type) => {
      const { battleLog } = get();
      const entry: BattleLogEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        message,
        type,
      };
      set({ battleLog: [...battleLog, entry] });
    },

    clearBattleLog: () => {
      set({ battleLog: [] });
    },

    exportBattleLog: () => {
      const { battleLog } = get();
      return battleLog
        .map(
          (entry) =>
            `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.message}`
        )
        .join('\n');
    },

    setContextMenu: (menu) => {
      set({ contextMenuPos: menu });
    },

    setPlaceMode: (unitClass) => {
      set({ placeMode: unitClass });
    },

    setIsAnimating: (animating) => {
      set({ isAnimating: animating });
    },

    initializeDemoUnits: () => {
      const { addUnit } = get();

      addUnit('warrior', { q: 1, r: 2 }, true);
      addUnit('mage', { q: 0, r: 3 }, true);
      addUnit('archer', { q: 1, r: 4 }, true);

      addUnit('warrior', { q: 6, r: 3 }, false);
      addUnit('mage', { q: 7, r: 4 }, false);
      addUnit('archer', { q: 6, r: 5 }, false);
    },
  };
});
