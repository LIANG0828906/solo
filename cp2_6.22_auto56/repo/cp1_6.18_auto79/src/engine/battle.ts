import { useGameStore } from '../store/gameStore';
import type { Unit } from '../types';
import { findBestTarget, findBestMove, evaluateThreat } from './ai';
import { getAttackRange, hexDistance } from './grid';
import { v4 as uuidv4 } from 'uuid';

const UNIT_NAMES: Record<string, string> = {
  warrior: '战士',
  archer: '弓箭手',
  cavalry: '骑兵',
};

export function getUnitName(type: string): string {
  return UNIT_NAMES[type] || type;
}

export function executePlayerMove(unitId: string, col: number, row: number): boolean {
  const state = useGameStore.getState();
  const unit = state.units.find(u => u.id === unitId);
  if (!unit || unit.team !== 'player' || unit.hasMoved || state.phase !== 'battle') return false;
  if (state.isReplaying) return false;

  state.moveUnit(unitId, col, row);

  const message = `玩家${getUnitName(unit.type)}移动到(${col},${row})`;
  const logId = uuidv4();
  useGameStore.setState(s => ({
    logs: [...s.logs, {
      id: logId,
      turn: s.turnNumber,
      team: 'player',
      message,
      timestamp: Date.now(),
    }],
  }));

  const logEntry = useGameStore.getState().logs[useGameStore.getState().logs.length - 1];
  useGameStore.getState().saveReplayStep(logEntry, 'move', { col, row });

  return true;
}

export function executePlayerAttack(attackerId: string, targetId: string): number {
  const state = useGameStore.getState();
  const attacker = state.units.find(u => u.id === attackerId);
  const target = state.units.find(u => u.id === targetId);
  if (!attacker || !target) return 0;
  if (attacker.team !== 'player' || attacker.hasAttacked || state.phase !== 'battle') return 0;
  if (state.isReplaying) return 0;

  const targets = getAttackRange(attacker, state.units);
  if (!targets.some(t => t.id === targetId)) return 0;

  const damage = useGameStore.getState().attackUnit(attackerId, targetId);

  const message = `玩家${getUnitName(attacker.type)}在(${attacker.col},${attacker.row})攻击AI${getUnitName(target.type)}，造成${damage}点伤害`;
  const logId = uuidv4();
  useGameStore.setState(s => ({
    logs: [...s.logs, {
      id: logId,
      turn: s.turnNumber,
      team: 'player',
      message,
      timestamp: Date.now(),
    }],
  }));

  const logEntry = useGameStore.getState().logs[useGameStore.getState().logs.length - 1];
  useGameStore.getState().saveReplayStep(logEntry, 'attack', { col: target.col, row: target.row });

  useGameStore.getState().checkGameEnd();

  return damage;
}

export function playerEndTurn(): void {
  const state = useGameStore.getState();
  if (state.phase !== 'battle' || state.currentTurn !== 'player' || state.isReplaying) return;

  const message = `玩家回合结束`;
  useGameStore.setState(s => ({
    logs: [...s.logs, {
      id: uuidv4(),
      turn: s.turnNumber,
      team: 'player',
      message,
      timestamp: Date.now(),
    }],
  }));

  state.nextTurn();
}

export async function executeAITurn(): Promise<void> {
  const state = useGameStore.getState();
  if (state.phase !== 'battle' || state.currentTurn !== 'ai' || state.isReplaying) return;

  const startMessage = `AI回合开始`;
  useGameStore.setState(s => ({
    logs: [...s.logs, {
      id: uuidv4(),
      turn: s.turnNumber,
      team: 'ai',
      message: startMessage,
      timestamp: Date.now(),
    }],
  }));

  await delay(500);

  const initialState = useGameStore.getState();
  const randomFactor = initialState.settings.aiRandomFactor;

  let aiUnits = initialState.units
    .filter(u => u.team === 'ai' && u.hp > 0)
    .sort((a, b) => {
      const aNearestEnemy = Math.min(...initialState.units
        .filter(e => e.team === 'player' && e.hp > 0)
        .map(e => hexDistance({ col: a.col, row: a.row }, { col: e.col, row: e.row })));
      const bNearestEnemy = Math.min(...initialState.units
        .filter(e => e.team === 'player' && e.hp > 0)
        .map(e => hexDistance({ col: b.col, row: b.row }, { col: e.col, row: e.row })));
      return aNearestEnemy - bNearestEnemy || b.attack - a.attack;
    });

  for (const unitInfo of aiUnits) {
    const s = useGameStore.getState();
    if (s.phase !== 'battle' || s.currentTurn !== 'ai') break;
    if (s.isReplaying) break;

    const unit = s.units.find(u => u.id === unitInfo.id);
    if (!unit || unit.hp <= 0) continue;

    const currentUnits = s.units;

    let attacked = false;
    if (!unit.hasAttacked) {
      const target = findBestTarget(unit, currentUnits, randomFactor);
      if (target) {
        const damage = useGameStore.getState().attackUnit(unit.id, target.id);
        const attackingUnit = useGameStore.getState().units.find(u => u.id === unit.id)!;
        const damagedTarget = useGameStore.getState().units.find(u => u.id === target.id)!;

        const message = `AI${getUnitName(attackingUnit.type)}在(${attackingUnit.col},${attackingUnit.row})攻击玩家${getUnitName(damagedTarget.type)}，造成${damage}点伤害`;
        useGameStore.setState(st => ({
          logs: [...st.logs, {
            id: uuidv4(),
            turn: st.turnNumber,
            team: 'ai',
            message,
            timestamp: Date.now(),
          }],
        }));

        const logEntry = useGameStore.getState().logs[useGameStore.getState().logs.length - 1];
        useGameStore.getState().saveReplayStep(logEntry, 'damage', { col: damagedTarget.col, row: damagedTarget.row });

        if (useGameStore.getState().checkGameEnd()) {
          break;
        }

        attacked = true;
        await delay(600);
      }
    }

    const afterAttackUnit = useGameStore.getState().units.find(u => u.id === unit.id);
    if (!afterAttackUnit || afterAttackUnit.hp <= 0) continue;

    if (!afterAttackUnit.hasMoved && !attacked) {
      const enemies = currentUnits.filter(u => u.team === 'player' && u.hp > 0);
      const bestMove = findBestMove(afterAttackUnit, enemies, currentUnits, randomFactor);

      if (bestMove) {
        useGameStore.getState().moveUnit(afterAttackUnit.id, bestMove.col, bestMove.row);

        const movedUnit = useGameStore.getState().units.find(u => u.id === unit.id)!;
        const message = `AI${getUnitName(movedUnit.type)}移动到(${bestMove.col},${bestMove.row})`;
        useGameStore.setState(st => ({
          logs: [...st.logs, {
            id: uuidv4(),
            turn: st.turnNumber,
            team: 'ai',
            message,
            timestamp: Date.now(),
          }],
        }));

        const logEntry = useGameStore.getState().logs[useGameStore.getState().logs.length - 1];
        useGameStore.getState().saveReplayStep(logEntry, 'move', bestMove);

        await delay(600);

        const afterMoveUnit = useGameStore.getState().units.find(u => u.id === unit.id);
        if (afterMoveUnit && afterMoveUnit.hp > 0 && !afterMoveUnit.hasAttacked) {
          const newTarget = findBestTarget(afterMoveUnit, useGameStore.getState().units, randomFactor);
          if (newTarget) {
            const damage = useGameStore.getState().attackUnit(afterMoveUnit.id, newTarget.id);
            const attackingUnit = useGameStore.getState().units.find(u => u.id === unit.id)!;
            const damagedTarget = useGameStore.getState().units.find(u => u.id === newTarget.id)!;

            const attackMessage = `AI${getUnitName(attackingUnit.type)}在(${attackingUnit.col},${attackingUnit.row})攻击玩家${getUnitName(damagedTarget.type)}，造成${damage}点伤害`;
            useGameStore.setState(st => ({
              logs: [...st.logs, {
                id: uuidv4(),
                turn: st.turnNumber,
                team: 'ai',
                message: attackMessage,
                timestamp: Date.now(),
              }],
            }));

            const logEntry2 = useGameStore.getState().logs[useGameStore.getState().logs.length - 1];
            useGameStore.getState().saveReplayStep(logEntry2, 'damage', { col: damagedTarget.col, row: damagedTarget.row });

            if (useGameStore.getState().checkGameEnd()) {
              break;
            }

            await delay(600);
          }
        }
      }
    }
  }

  const endState = useGameStore.getState();
  if (endState.phase === 'battle' && endState.currentTurn === 'ai' && !endState.isReplaying) {
    const endMessage = `AI回合结束`;
    useGameStore.setState(st => ({
      logs: [...st.logs, {
        id: uuidv4(),
        turn: st.turnNumber,
        team: 'ai',
        message: endMessage,
        timestamp: Date.now(),
      }],
    }));

    endState.nextTurn();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function startBattle(): void {
  const state = useGameStore.getState();
  const playerUnits = state.units.filter(u => u.team === 'player');
  if (playerUnits.length === 0) return;

  state.deployAIUnits();

  useGameStore.setState(s => ({
    phase: 'battle',
    currentTurn: 'player',
    turnNumber: 1,
    logs: [{
      id: uuidv4(),
      turn: 1,
      team: 'player',
      message: '战斗开始！玩家回合',
      timestamp: Date.now(),
    }],
    replaySteps: [],
  }));
}
