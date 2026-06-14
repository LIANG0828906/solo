import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Card, Deck, BattleCard, BattleLogEntry, BattleStats } from './types';

interface BattleSimulatorProps {
  deck: Deck;
  logs: BattleLogEntry[];
  onLogsChange: (logs: BattleLogEntry[]) => void;
}

const GRID_ROWS = 3;
const GRID_COLS = 5;
const STARTING_HAND_SIZE = 5;
const TURN_INTERVAL = 1000;
const START_MANA = 3;
const MANA_PER_TURN = 1;
const MAX_MANA = 10;
const MAX_LOGS = 50;

type GridCell = { row: number; col: number };

interface GameState {
  turn: number;
  currentPlayer: 'A' | 'B';
  manaA: number;
  manaB: number;
  maxManaA: number;
  maxManaB: number;
  board: (BattleCard | null)[][];
  handA: BattleCard[];
  handB: BattleCard[];
  deckA: BattleCard[];
  deckB: BattleCard[];
}

const createBattleCard = (card: Card, owner: 'A' | 'B'): BattleCard => ({
  ...card,
  instanceId: uuidv4(),
  owner,
  currentHealth: card.health,
  position: null,
  hasAttacked: false,
  justSummoned: true,
});

const shuffle = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const buildEmptyBoard = (): (BattleCard | null)[][] =>
  Array.from({ length: GRID_ROWS }, () => Array<BattleCard | null>(GRID_COLS).fill(null));

const countEmptyCells = (board: (BattleCard | null)[][], owner: 'A' | 'B'): GridCell[] => {
  const cells: GridCell[] = [];
  const startRow = owner === 'A' ? 1 : 0;
  const endRow = owner === 'A' ? GRID_ROWS - 1 : 1;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (r >= startRow && r <= endRow && board[r][c] === null) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
};

const BattleSimulator: React.FC<BattleSimulatorProps> = ({ deck, logs, onLogsChange }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef(false);
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [closingStats, setClosingStats] = useState(false);
  const [flyInCards, setFlyInCards] = useState<Set<string>>(new Set());
  const [attackingCardId, setAttackingCardId] = useState<string | null>(null);
  const [attackTargetCell, setAttackTargetCell] = useState<GridCell | null>(null);
  const [hitCells, setHitCells] = useState<Set<string>>(new Set());
  const [cellSize, setCellSize] = useState(80);

  const logRef = useRef<HTMLDivElement>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runTurnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setCellSize(w < 600 ? 50 : 80);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((turn: number, message: string) => {
    const entry: BattleLogEntry = {
      id: uuidv4(),
      turn,
      message,
      timestamp: Date.now(),
    };
    onLogsChange([...logs.slice(-(MAX_LOGS - 1)), entry]);
  }, [logs, onLogsChange]);

  const startBattle = useCallback(() => {
    if (deck.length < 5) return;

    const battleDeckA = shuffle(deck.map(c => createBattleCard(c, 'A')));
    const battleDeckB = shuffle(deck.map(c => createBattleCard(c, 'B')));

    const handA = battleDeckA.splice(0, STARTING_HAND_SIZE);
    const handB = battleDeckB.splice(0, STARTING_HAND_SIZE);

    const initialState: GameState = {
      turn: 1,
      currentPlayer: 'A',
      manaA: START_MANA,
      manaB: START_MANA,
      maxManaA: START_MANA,
      maxManaB: START_MANA,
      board: buildEmptyBoard(),
      handA,
      handB,
      deckA: battleDeckA,
      deckB: battleDeckB,
    };

    setGameState(initialState);
    setStats(null);
    setShowStats(false);
    setIsSimulating(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setFlyInCards(new Set());
    setAttackingCardId(null);
    setAttackTargetCell(null);
    setHitCells(new Set());

    onLogsChange([]);

    setTimeout(() => {
      addLog(1, `⚔️ 战斗开始！玩家A先手，双方各抽${STARTING_HAND_SIZE}张起始手牌。`);
    }, 50);
  }, [deck, addLog, onLogsChange]);

  const stopBattle = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const pauseBattle = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsPaused(true);
    isPausedRef.current = true;
  }, []);

  const resumeBattle = useCallback(() => {
    simIntervalRef.current = setInterval(() => {
      if (!isPausedRef.current && runTurnRef.current) {
        runTurnRef.current();
      }
    }, TURN_INTERVAL);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const togglePause = useCallback(() => {
    if (isPausedRef.current) {
      resumeBattle();
    } else {
      pauseBattle();
    }
  }, [pauseBattle, resumeBattle]);

  const triggerFlyIn = useCallback((cardId: string) => {
    setFlyInCards(prev => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
    setTimeout(() => {
      setFlyInCards(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 600);
  }, []);

  const triggerAttack = useCallback((attackerId: string, target: GridCell, targetId: string) => {
    setAttackingCardId(attackerId);
    setAttackTargetCell(target);

    setTimeout(() => {
      setHitCells(prev => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
      setTimeout(() => {
        setHitCells(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }, 300);
    }, 150);

    setTimeout(() => {
      setAttackingCardId(null);
      setAttackTargetCell(null);
    }, 300);
  }, []);

  const finalizeBattle = useCallback((state: GameState) => {
    stopBattle();

    let aSurvivors = 0;
    let bSurvivors = 0;
    let aHealth = 0;
    let bHealth = 0;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const card = state.board[r][c];
        if (card) {
          if (card.owner === 'A') {
            aSurvivors++;
            aHealth += card.currentHealth;
          } else {
            bSurvivors++;
            bHealth += card.currentHealth;
          }
        }
      }
    }

    let winner: 'A' | 'B' | 'draw';
    if (aSurvivors > bSurvivors) winner = 'A';
    else if (bSurvivors > aSurvivors) winner = 'B';
    else {
      if (aHealth > bHealth) winner = 'A';
      else if (bHealth > aHealth) winner = 'B';
      else winner = 'draw';
    }

    const finalStats: BattleStats = {
      winner,
      aSurvivors,
      bSurvivors,
      aTotalHealth: aHealth,
      bTotalHealth: bHealth,
    };

    setStats(finalStats);
    setShowStats(true);

    const winnerText = winner === 'draw' ? '平局！' : `玩家${winner}获胜！`;
    setTimeout(() => {
      addLog(state.turn, `🏆 战斗结束！${winnerText} 存活：A方${aSurvivors}张(${aHealth}血) vs B方${bSurvivors}张(${bHealth}血)`);
    }, 50);
  }, [addLog, stopBattle]);

  useEffect(() => {
    if (!isSimulating || !gameState) return;

    const runTurn = () => {
      if (isPausedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;

        let state: GameState = {
          ...prev,
          board: prev.board.map(row => row.map(cell => cell ? { ...cell } : null)),
          handA: [...prev.handA].map(c => ({ ...c })),
          handB: [...prev.handB].map(c => ({ ...c })),
          deckA: [...prev.deckA].map(c => ({ ...c })),
          deckB: [...prev.deckB].map(c => ({ ...c })),
        };

        const cp = state.currentPlayer;
        const isA = cp === 'A';

        let mana = isA ? state.manaA : state.manaB;

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const card = state.board[r][c];
            if (card && card.owner === cp) {
              card.hasAttacked = false;
              card.justSummoned = false;
            }
          }
        }

        const hand = isA ? state.handA : state.handB;
        const summonable = hand
          .map((card, idx) => ({ card, idx }))
          .filter(({ card }) => card.cost <= mana)
          .sort((a, b) => b.card.cost - a.card.cost);

        const emptyCells = countEmptyCells(state.board, cp);

        for (const { card, idx } of summonable) {
          if (emptyCells.length === 0) break;
          const cellIdx = Math.floor(Math.random() * emptyCells.length);
          const cell = emptyCells.splice(cellIdx, 1)[0];
          const placedCard: BattleCard = { ...card, position: cell, justSummoned: true };
          state.board[cell.row][cell.col] = placedCard;
          mana -= card.cost;
          if (isA) {
            state.handA = state.handA.filter((_, i) => i !== idx);
          } else {
            state.handB = state.handB.filter((_, i) => i !== idx);
          }
          triggerFlyIn(placedCard.instanceId);
          addLog(state.turn, `回合${state.turn}: 玩家${cp}召唤了"${card.name}"到(${cell.row + 1},${cell.col + 1})`);
          break;
        }

        if (isA) {
          state.manaA = mana;
        } else {
          state.manaB = mana;
        }

        setTimeout(() => {
          setGameState(currentState => {
            if (!currentState) return currentState;
            const attackState: GameState = {
              ...currentState,
              board: currentState.board.map(row => row.map(cell => cell ? { ...cell } : null)),
              handA: [...currentState.handA].map(c => ({ ...c })),
              handB: [...currentState.handB].map(c => ({ ...c })),
              deckA: [...currentState.deckA].map(c => ({ ...c })),
              deckB: [...currentState.deckB].map(c => ({ ...c })),
            };

            const attackers: BattleCard[] = [];
            for (let r = 0; r < GRID_ROWS; r++) {
              for (let c = 0; c < GRID_COLS; c++) {
                const card = attackState.board[r][c];
                if (card && card.owner === cp && !card.hasAttacked && !card.justSummoned && card.attack > 0) {
                  attackers.push(card);
                }
              }
            }

            const enemyOwner = cp === 'A' ? 'B' : 'A';

            for (const attacker of attackers) {
              if (attacker.position) {
                const enemyCells: GridCell[] = [];
                for (let r = 0; r < GRID_ROWS; r++) {
                  for (let c = 0; c < GRID_COLS; c++) {
                    const card = attackState.board[r][c];
                    if (card && card.owner === enemyOwner) {
                      enemyCells.push({ row: r, col: c });
                    }
                  }
                }

                if (enemyCells.length > 0) {
                  const targetCell = enemyCells[Math.floor(Math.random() * enemyCells.length)];
                  const target = attackState.board[targetCell.row][targetCell.col];
                  if (attacker && target) {
                    triggerAttack(attacker.instanceId, targetCell, `${targetCell.row}-${targetCell.col}`);

                    target.currentHealth -= attacker.attack;
                    attacker.currentHealth -= target.attack;

                    attacker.hasAttacked = true;

                    const attackerCell = attacker.position;
                    if (attackerCell) {
                      attackState.board[attackerCell.row][attackerCell.col] = attacker.currentHealth <= 0 ? null : attacker;
                    }
                    attackState.board[targetCell.row][targetCell.col] = target.currentHealth <= 0 ? null : target;

                    const attackLog = `回合${state.turn}: 玩家${cp}的"${attacker.name}"攻击了玩家${enemyOwner}的"${target.name}"`;
                    if (attacker.currentHealth <= 0 && target.currentHealth <= 0) {
                      addLog(state.turn, `${attackLog}，双方同归于尽！`);
                    } else if (attacker.currentHealth <= 0) {
                      addLog(state.turn, `${attackLog}，"${attacker.name}"被击败！`);
                    } else if (target.currentHealth <= 0) {
                      addLog(state.turn, `${attackLog}，"${target.name}"被击败！`);
                    } else {
                      addLog(state.turn, attackLog);
                    }
                  }
                }
              }
            }

            return attackState;
          });
        }, 400);

        const nextPlayer: 'A' | 'B' = cp === 'A' ? 'B' : 'A';
        const isNextA = nextPlayer === 'A';

        if (isNextA) {
          state.maxManaA = Math.min(MAX_MANA, state.maxManaA + MANA_PER_TURN);
          state.manaA = state.maxManaA;
          if (state.deckA.length > 0) {
            const drawn = state.deckA.shift()!;
            state.handA.push(drawn);
          }
        } else {
          state.maxManaB = Math.min(MAX_MANA, state.maxManaB + MANA_PER_TURN);
          state.manaB = state.maxManaB;
          if (state.deckB.length > 0) {
            const drawn = state.deckB.shift()!;
            state.handB.push(drawn);
          }
        }

        state.currentPlayer = nextPlayer;
        if (nextPlayer === 'A') {
          state.turn = state.turn + 1;
        }

        const totalTurns = state.turn;
        if (totalTurns > 20) {
          setTimeout(() => finalizeBattle(state), 800);
          return state;
        }

        const aHas = state.handA.length > 0 || state.deckA.length > 0;
        const bHas = state.handB.length > 0 || state.deckB.length > 0;
        let aBoard = 0;
        let bBoard = 0;
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const card = state.board[r][c];
            if (card) {
              if (card.owner === 'A') aBoard++;
              else bBoard++;
            }
          }
        }

        const aCanAct = aBoard > 0 || aHas;
        const bCanAct = bBoard > 0 || bHas;

        if (!aCanAct || !bCanAct) {
          setTimeout(() => finalizeBattle(state), 800);
        }

        return state;
      });
    };

    runTurnRef.current = runTurn;
    simIntervalRef.current = setInterval(runTurn, TURN_INTERVAL);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [isSimulating, addLog, triggerFlyIn, triggerAttack, finalizeBattle]);

  const closeStats = () => {
    setClosingStats(true);
    setTimeout(() => {
      setShowStats(false);
      setClosingStats(false);
    }, 300);
  };

  const getCellStyle = (row: number, _col: number) => {
    return {
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      backgroundColor: '#e2e8f0',
      border: '1px solid #fff',
      borderRadius: '8px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      position: 'relative' as const,
      overflow: 'visible' as const,
      boxSizing: 'border-box' as const,
      boxShadow: row === 2 ? 'inset 0 -2px 8px rgba(56, 189, 248, 0.12)' :
        row === 0 ? 'inset 0 2px 8px rgba(251, 146, 60, 0.12)' : 'none',
    };
  };

  const renderMiniCard = (card: BattleCard) => {
    const isFlying = flyInCards.has(card.instanceId);
    const isAttacking = attackingCardId === card.instanceId;
    const healthPct = Math.max(0, (card.currentHealth / card.maxHealth) * 100);
    const healthBar = healthPct > 66 ? '#22c55e' : healthPct > 33 ? '#eab308' : '#ef4444';

    let attackDx = '0px';
    let attackDy = '0px';
    if (isAttacking && attackTargetCell && card.position) {
      const dr = attackTargetCell.row - card.position.row;
      const dc = attackTargetCell.col - card.position.col;
      attackDx = `${dc * (cellSize + 4)}px`;
      attackDy = `${dr * (cellSize + 4)}px`;
    }

    return (
      <div
        key={card.instanceId}
        className={`${isFlying ? 'fly-in' : ''} ${isAttacking ? 'attack-anim' : ''}`}
        style={{
          width: `${cellSize - 8}px`,
          height: `${cellSize - 8}px`,
          position: 'absolute',
          top: '4px',
          left: '4px',
          backgroundColor: card.owner === 'A' ? '#fff' : '#fef3c7',
          borderRadius: '6px',
          border: card.owner === 'A' ? '2px solid #38bdf8' : '2px solid #fb923c',
          boxShadow: card.justSummoned
            ? `0 0 12px ${card.owner === 'A' ? 'rgba(56, 189, 248, 0.55)' : 'rgba(251, 146, 60, 0.55)'}`
            : '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: '2px',
          transition: 'none',
          zIndex: isAttacking ? 100 : card.justSummoned ? 5 : 'auto',
          ['--attack-dx' as any]: attackDx,
          ['--attack-dy' as any]: attackDy,
          cursor: 'default',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: `${Math.max(7, cellSize * 0.09)}px`,
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '1px',
        }}>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: `${cellSize * 0.5}px`,
          }}>
            {card.name}
          </span>
          <span style={{
            backgroundColor: '#0ea5e9',
            color: '#fff',
            borderRadius: '50%',
            width: `${cellSize * 0.2}px`,
            height: `${cellSize * 0.2}px`,
            fontSize: `${Math.max(6, cellSize * 0.12)}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {card.cost}
          </span>
        </div>
        <div style={{
          flex: 1,
          fontSize: `${cellSize * 0.28}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}>
          {card.owner === 'A' ? '🛡️' : '⚔️'}
        </div>
        <div style={{
          height: '2px',
          backgroundColor: '#334155',
          borderRadius: '1px',
          overflow: 'hidden',
          marginBottom: '1px',
        }}>
          <div style={{
            height: '100%',
            width: `${healthPct}%`,
            backgroundColor: healthBar,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: `${Math.max(6, cellSize * 0.11)}px`,
          fontWeight: 700,
        }}>
          <span style={{ color: '#ef4444' }}>⚔{card.attack}</span>
          <span style={{ color: healthBar }}>❤{card.currentHealth}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 700,
          marginRight: 'auto',
        }}>
          ⚔️ 战斗模拟器
        </h2>
        {gameState && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            fontSize: '12px',
          }}>
            <span style={{
              padding: '4px 10px',
              backgroundColor: gameState.currentPlayer === 'A' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(251, 146, 60, 0.2)',
              color: gameState.currentPlayer === 'A' ? '#38bdf8' : '#fb923c',
              borderRadius: '12px',
              fontWeight: 600,
            }}>
              回合 {gameState.turn} · 玩家{gameState.currentPlayer}行动
            </span>
            <span style={{ color: '#38bdf8' }}>
              A💧{gameState.manaA}/{gameState.maxManaA}
            </span>
            <span style={{ color: '#94a3b8' }}>
              🃏{gameState.handA.length + gameState.deckA.length}
            </span>
            <span style={{ color: '#fb923c' }}>
              💧{gameState.manaB}/{gameState.maxManaB}
            </span>
            <span style={{ color: '#94a3b8' }}>
              🃏{gameState.handB.length + gameState.deckB.length}
            </span>
          </div>
        )}
        <button
          onClick={isSimulating ? stopBattle : startBattle}
          style={{
            padding: '8px 18px',
            backgroundColor: isSimulating ? '#ef4444' : deck.length < 5 ? '#475569' : '#0ea5e9',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: deck.length < 5 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isSimulating && deck.length >= 5) e.currentTarget.style.backgroundColor = '#0284c7';
            if (isSimulating) e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            if (!isSimulating && deck.length >= 5) e.currentTarget.style.backgroundColor = '#0ea5e9';
            if (isSimulating) e.currentTarget.style.backgroundColor = '#ef4444';
          }}
          onMouseDown={(e) => {
            if (!isSimulating && deck.length >= 5) e.currentTarget.style.backgroundColor = '#0369a1';
          }}
          onMouseUp={(e) => {
            if (!isSimulating && deck.length >= 5) e.currentTarget.style.backgroundColor = '#0284c7';
          }}
          disabled={!isSimulating && deck.length < 5}
        >
          {isSimulating ? '⏹ 停止战斗' : '▶ 开始战斗'}
        </button>
        {isSimulating && gameState && (
          <button
            onClick={togglePause}
            style={{
              padding: '8px 18px',
              backgroundColor: isPaused ? '#22c55e' : '#0ea5e9',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isPaused ? '#16a34a' : '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isPaused ? '#22c55e' : '#0ea5e9';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = isPaused ? '#15803d' : '#0369a1';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = isPaused ? '#16a34a' : '#0284c7';
            }}
          >
            {isPaused ? '▶ 继续' : '⏸ 暂停'}
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'auto',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxWidth: `${GRID_COLS * (cellSize + 4) + 20}px`,
          }}>
            <div style={{
              textAlign: 'center',
              color: '#fb923c',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              — 玩家 B 区域 —
            </div>
            {Array.from({ length: GRID_ROWS }).map((_, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: GRID_COLS }).map((_, colIdx) => {
                  const cellKey = `${rowIdx}-${colIdx}`;
                  const card = gameState?.board[rowIdx][colIdx] || null;
                  const isHit = hitCells.has(cellKey);
                  return (
                    <div
                      key={cellKey}
                      className={isHit ? 'target-hit' : ''}
                      style={getCellStyle(rowIdx, colIdx)}
                    >
                      {card && renderMiniCard(card)}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{
              textAlign: 'center',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
              marginTop: '4px',
            }}>
              — 玩家 A 区域 —
            </div>
          </div>
        </div>

        {!gameState && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#64748b',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>点击"开始战斗"启动模拟</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
              {deck.length < 5 ? `需要至少5张卡牌（当前${deck.length}张）` : '卡组已就绪'}
            </p>
          </div>
        )}
      </div>

      <div style={{
        width: '100%',
        borderTop: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '40%',
        minHeight: '120px',
      }}>
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#94a3b8',
          }}>
            📜 战斗日志 ({logs.length}/{MAX_LOGS})
          </h3>
          <button
            onClick={() => onLogsChange([])}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              backgroundColor: '#334155',
              color: '#94a3b8',
              borderRadius: '4px',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#475569';
              e.currentTarget.style.color = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            清空
          </button>
        </div>
        <div
          ref={logRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px',
            fontSize: '11px',
            lineHeight: 1.6,
          }}
        >
          {logs.length === 0 ? (
            <div style={{
              color: '#475569',
              textAlign: 'center',
              padding: '16px',
              fontSize: '11px',
            }}>
              暂无日志，开始战斗后将显示战斗记录
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{
                padding: '4px 0',
                borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                color: '#cbd5e1',
              }}>
                <span style={{ color: '#64748b' }}>
                  [{log.turn < 10 ? `0${log.turn}` : log.turn}]{' '}
                </span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        onClick={closeStats}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          opacity: showStats && !closingStats ? 1 : 0,
          transition: closingStats ? 'opacity 0.3s ease' : 'opacity 0.4s ease',
          visibility: showStats || closingStats ? 'visible' : 'hidden',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '32px',
            minWidth: '360px',
            maxWidth: '90vw',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            transform: showStats && !closingStats ? 'translateY(0)' : 'translateY(-20px)',
            opacity: showStats && !closingStats ? 1 : 0,
            transition: closingStats
              ? 'transform 0.3s ease, opacity 0.3s ease'
              : 'transform 0.4s ease-out, opacity 0.4s ease-out',
          }}
        >
          {stats && (
            <>
              <button
                onClick={closeStats}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#334155',
                  color: '#94a3b8',
                  fontSize: '18px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ×
              </button>

              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '8px',
                }}>
                  {stats.winner === 'draw' ? '🤝' : '🏆'}
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: stats.winner === 'draw' ? '#eab308' : stats.winner === 'A' ? '#38bdf8' : '#fb923c',
                  marginBottom: '4px',
                }}>
                  {stats.winner === 'draw' ? '平 局' : `玩家 ${stats.winner} 获胜`}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                }}>
                  战斗统计结果
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#38bdf8',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}>
                    🔵 玩家 A
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    marginBottom: '4px',
                  }}>
                    {stats.aSurvivors}
                    <span style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      fontWeight: 400,
                    }}>
                       张存活
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#4ade80',
                    fontWeight: 600,
                  }}>
                    ❤ 剩余 {stats.aTotalHealth} 血
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(251, 146, 60, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#fb923c',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}>
                    🟠 玩家 B
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    marginBottom: '4px',
                  }}>
                    {stats.bSurvivors}
                    <span style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      fontWeight: 400,
                    }}>
                       张存活
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#4ade80',
                    fontWeight: 600,
                  }}>
                    ❤ 剩余 {stats.bTotalHealth} 血
                  </div>
                </div>
              </div>

              <button
                onClick={closeStats}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0ea5e9',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
                onMouseDown={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
                onMouseUp={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
              >
                确 定
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleSimulator;
