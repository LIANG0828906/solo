import { create } from 'zustand';
import {
  Unit,
  Position,
  TerrainType,
  GamePhase,
  AiDecision,
  HistoryRecord,
} from '../types/game';
import { generateTerrain, deployUnits, calculateDamage } from '../utils/gameUtils';
import { getReachableCells, getAttackableTargets } from '../logic/pathfinding';
import { requestAiDecision } from '../services/apiService';

interface GameState {
  mapSize: number;
  terrain: TerrainType[][];
  units: Unit[];
  selectedUnitId: string | null;
  reachableCells: Position[];
  attackableTargets: Unit[];
  currentTurn: 'player' | 'ai';
  gamePhase: GamePhase;
  turnNumber: number;
  history: HistoryRecord[];
  message: string;
  winner: 'player' | 'ai' | null;

  initGame: (size: number) => void;
  selectUnit: (unitId: string) => void;
  moveUnit: (unitId: string, target: Position, path: Position[]) => void;
  attackUnit: (attackerId: string, targetId: string) => void;
  endPlayerTurn: () => void;
  executeAiTurn: () => Promise<void>;
  setGamePhase: (phase: GamePhase) => void;
  addHistoryRecord: (record: HistoryRecord) => void;
  resetUnitActions: (team: 'player' | 'ai') => void;
  deselectUnit: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mapSize: 8,
  terrain: [],
  units: [],
  selectedUnitId: null,
  reachableCells: [],
  attackableTargets: [],
  currentTurn: 'player',
  gamePhase: 'map-select',
  turnNumber: 1,
  history: [],
  message: '选择地图大小开始游戏',
  winner: null,

  initGame: (size: number) => {
    const terrain = generateTerrain(size);
    const units = deployUnits(size);
    set({
      mapSize: size,
      terrain,
      units,
      selectedUnitId: null,
      reachableCells: [],
      attackableTargets: [],
      currentTurn: 'player',
      gamePhase: 'player-turn',
      turnNumber: 1,
      history: [],
      message: '玩家回合 - 选择一个单位',
      winner: null,
    });
  },

  selectUnit: (unitId: string) => {
    const { units, terrain, mapSize, currentTurn, gamePhase } = get();
    if (gamePhase !== 'player-turn' || currentTurn !== 'player') return;

    const unit = units.find((u) => u.id === unitId);
    if (!unit || !unit.isAlive || unit.team !== 'player') return;

    let reachable: Position[] = [];
    let attackable: Unit[] = [];

    if (!unit.hasMoved) {
      reachable = getReachableCells(unit.position, unit.moveRange, terrain, mapSize, units);
    }

    if (!unit.hasAttacked) {
      attackable = getAttackableTargets(unit.position, unit.attackRange, units, 'ai');
    }

    set({
      selectedUnitId: unitId,
      reachableCells: reachable,
      attackableTargets: attackable,
      message: `已选择 ${unit.name}`,
    });
  },

  moveUnit: (unitId: string, target: Position, path: Position[]) => {
    const { units } = get();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    const newUnits = units.map((u) =>
      u.id === unitId
        ? { ...u, position: { ...target }, hasMoved: true }
        : u
    );

    const movedUnit = newUnits.find((u) => u.id === unitId)!;
    const attackable = getAttackableTargets(
      movedUnit.position,
      movedUnit.attackRange,
      newUnits,
      'ai'
    );

    set({
      units: newUnits,
      reachableCells: [],
      attackableTargets: attackable,
      message: attackable.length > 0 ? '选择攻击目标或结束回合' : '移动完成',
    });
  },

  attackUnit: (attackerId: string, targetId: string) => {
    const { units } = get();
    const attacker = units.find((u) => u.id === attackerId);
    const target = units.find((u) => u.id === targetId);

    if (!attacker || !target) return null;

    const damage = calculateDamage(attacker, target);
    const newHp = Math.max(0, target.hp - damage);
    const isKilled = newHp <= 0;

    const newUnits = units.map((u) => {
      if (u.id === attackerId) {
        return { ...u, hasAttacked: true };
      }
      if (u.id === targetId) {
        return { ...u, hp: newHp, isAlive: !isKilled };
      }
      return u;
    });

    const playerAlive = newUnits.some((u) => u.team === 'player' && u.isAlive);
    const aiAlive = newUnits.some((u) => u.team === 'ai' && u.isAlive);

    let winner: 'player' | 'ai' | null = null;
    let phase = get().gamePhase;
    let message = `${attacker.name} 对 ${target.name} 造成 ${damage} 点伤害！`;

    if (isKilled) {
      message += ` ${target.name} 被击败！`;
    }

    if (!playerAlive) {
      winner = 'ai';
      phase = 'game-over';
      message = '游戏结束 - AI获胜！';
    } else if (!aiAlive) {
      winner = 'player';
      phase = 'game-over';
      message = '游戏结束 - 玩家获胜！';
    }

    const updatedAttacker = newUnits.find((u) => u.id === attackerId)!;
    const newAttackable = getAttackableTargets(
      updatedAttacker.position,
      updatedAttacker.attackRange,
      newUnits,
      'ai'
    );

    set({
      units: newUnits,
      attackableTargets: updatedAttacker.hasAttacked ? [] : newAttackable,
      winner,
      gamePhase: phase,
      message,
    });

    return { damage, isKilled };
  },

  endPlayerTurn: () => {
    set({
      currentTurn: 'ai',
      selectedUnitId: null,
      reachableCells: [],
      attackableTargets: [],
      gamePhase: 'ai-turn',
      message: 'AI回合 - 思考中...',
    });
  },

  executeAiTurn: async () => {
    const { mapSize, terrain, units, history } = get();

    try {
      const response = await requestAiDecision({
        mapSize,
        terrain,
        units,
      });

      const decisions = response.decisions;
      let currentUnits = [...units];
      const newHistory = [...history];

      set({ gamePhase: 'animating' });

      for (const decision of decisions) {
        const unit = currentUnits.find((u) => u.id === decision.unitId);
        if (!unit || !unit.isAlive) continue;

        if (decision.path.length > 1) {
          currentUnits = currentUnits.map((u) =>
            u.id === decision.unitId
              ? { ...u, position: { ...decision.targetPosition }, hasMoved: true }
              : u
          );
        }

        let attackResult: string | null = null;
        let targetUnitName: string | null = null;
        let damage: number | null = null;

        if (decision.attackTarget) {
          const attacker = currentUnits.find((u) => u.id === decision.unitId)!;
          const target = currentUnits.find((u) => u.id === decision.attackTarget);

          if (target && target.isAlive) {
            damage = calculateDamage(attacker, target);
            const newHp = Math.max(0, target.hp - damage);
            const isKilled = newHp <= 0;

            currentUnits = currentUnits.map((u) => {
              if (u.id === decision.unitId) {
                return { ...u, hasAttacked: true };
              }
              if (u.id === decision.attackTarget) {
                return { ...u, hp: newHp, isAlive: !isKilled };
              }
              return u;
            });

            attackResult = isKilled ? '击杀' : `伤害${damage}`;
            targetUnitName = target.name;
          }
        }

        const record: HistoryRecord = {
          id: `hist-${Date.now()}-${decision.unitId}`,
          timestamp: Date.now(),
          unitName: unit.name,
          moveDistance: decision.path.length - 1,
          attackResult,
          targetUnitName,
          damage,
          decision,
          unitsSnapshot: JSON.parse(JSON.stringify(currentUnits)),
        };

        newHistory.unshift(record);
        if (newHistory.length > 5) {
          newHistory.pop();
        }
      }

      const resetUnits = currentUnits.map((u) =>
        u.team === 'player' ? { ...u, hasMoved: false, hasAttacked: false } : u
      );

      const playerAlive = resetUnits.some((u) => u.team === 'player' && u.isAlive);
      const aiAlive = resetUnits.some((u) => u.team === 'ai' && u.isAlive);

      let winner: 'player' | 'ai' | null = null;
      let message = '玩家回合';
      let phase: GamePhase = 'player-turn';

      if (!playerAlive) {
        winner = 'ai';
        phase = 'game-over';
        message = '游戏结束 - AI获胜！';
      } else if (!aiAlive) {
        winner = 'player';
        phase = 'game-over';
        message = '游戏结束 - 玩家获胜！';
      }

      set((state) => ({
        units: resetUnits,
        currentTurn: 'player',
        gamePhase: phase,
        turnNumber: state.turnNumber + 1,
        history: newHistory,
        winner,
        message,
      }));
    } catch (error) {
      console.error('AI决策失败:', error);
      set({
        currentTurn: 'player',
        gamePhase: 'player-turn',
        message: 'AI决策失败，回到玩家回合',
      });
    }
  },

  setGamePhase: (phase: GamePhase) => {
    set({ gamePhase: phase });
  },

  addHistoryRecord: (record: HistoryRecord) => {
    set((state) => {
      const newHistory = [record, ...state.history].slice(0, 5);
      return { history: newHistory };
    });
  },

  resetUnitActions: (team: 'player' | 'ai') => {
    set((state) => ({
      units: state.units.map((u) =>
        u.team === team ? { ...u, hasMoved: false, hasAttacked: false } : u
      ),
    }));
  },

  deselectUnit: () => {
    set({
      selectedUnitId: null,
      reachableCells: [],
      attackableTargets: [],
      message: '选择一个单位',
    });
  },
}));
