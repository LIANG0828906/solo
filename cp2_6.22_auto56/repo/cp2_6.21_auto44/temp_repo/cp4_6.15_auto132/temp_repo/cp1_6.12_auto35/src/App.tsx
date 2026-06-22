import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapGrid from './components/MapGrid';
import UnitPanel from './components/UnitPanel';
import StatusPanel from './components/StatusPanel';
import { useGameStore } from './store/gameStore';
import { Position, AiDecision } from './types/game';
import { findPath } from './logic/pathfinding';
import './App.css';

interface AttackInfo {
  attackerId: string;
  targetId: string;
  damage: number;
}

const App: React.FC = () => {
  const {
    gamePhase,
    currentTurn,
    units,
    terrain,
    mapSize,
    selectedUnitId,
  } = useGameStore();

  const moveUnit = useGameStore((state) => state.moveUnit);
  const attackUnit = useGameStore((state) => state.attackUnit);
  const executeAiTurn = useGameStore((state) => state.executeAiTurn);
  const setGamePhase = useGameStore((state) => state.setGamePhase);

  const [movingUnit, setMovingUnit] = useState<{
    unitId: string;
    path: Position[];
  } | null>(null);

  const [attackingUnits, setAttackingUnits] = useState<AttackInfo[]>([]);
  const [dyingUnits, setDyingUnits] = useState<string[]>([]);
  const [aiPath, setAiPath] = useState<Position[] | null>(null);

  const animatingRef = useRef(false);

  const handleMoveUnit = useCallback(
    (unitId: string, target: Position, path: Position[]) => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      setMovingUnit({ unitId, path });

      setTimeout(() => {
        moveUnit(unitId, target, path);
        setMovingUnit(null);
        animatingRef.current = false;
      }, 300);
    },
    [moveUnit]
  );

  const handleAttackUnit = useCallback(
    (attackerId: string, targetId: string) => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      const result = attackUnit(attackerId, targetId);
      if (result) {
        const attackInfo: AttackInfo = {
          attackerId,
          targetId,
          damage: result.damage,
        };
        setAttackingUnits((prev) => [...prev, attackInfo]);

        if (result.isKilled) {
          setTimeout(() => {
            setDyingUnits((prev) => [...prev, targetId]);
          }, 300);

          setTimeout(() => {
            setDyingUnits((prev) => prev.filter((id) => id !== targetId));
          }, 800);
        }

        setTimeout(() => {
          setAttackingUnits((prev) =>
            prev.filter(
              (a) =>
                !(a.attackerId === attackerId && a.targetId === targetId)
            )
          );
          animatingRef.current = false;
        }, 800);
      } else {
        animatingRef.current = false;
      }
    },
    [attackUnit]
  );

  useEffect(() => {
    if (gamePhase === 'ai-turn' && currentTurn === 'ai') {
      const runAiTurn = async () => {
        setGamePhase('animating');
        
        try {
          const aiUnits = units.filter((u) => u.team === 'ai' && u.isAlive);
          
          for (const aiUnit of aiUnits) {
            const playerUnits = units.filter((u) => u.team === 'player' && u.isAlive);
            if (playerUnits.length === 0) break;

            let bestTarget = playerUnits[0];
            let bestDist = Infinity;

            for (const player of playerUnits) {
              const dist =
                Math.abs(player.position.x - aiUnit.position.x) +
                Math.abs(player.position.y - aiUnit.position.y);
              if (dist < bestDist) {
                bestDist = dist;
                bestTarget = player;
              }
            }

            const path = findPath(
              aiUnit.position,
              bestTarget.position,
              terrain,
              mapSize,
              units
            );

            if (path && path.length > 1) {
              const moveSteps = Math.min(aiUnit.moveRange + 1, path.length);
              const movePath = path.slice(0, moveSteps);
              const targetPos = movePath[movePath.length - 1];

              setAiPath(movePath);
              setMovingUnit({ unitId: aiUnit.id, path: movePath });

              await new Promise((resolve) => setTimeout(resolve, 600));

              moveUnit(aiUnit.id, targetPos, movePath);
              setMovingUnit(null);
              setAiPath(null);

              const currentUnits = useGameStore.getState().units;
              const updatedAiUnit = currentUnits.find((u) => u.id === aiUnit.id);
              if (updatedAiUnit) {
                const inRange = playerUnits.some(
                  (p) =>
                    p.isAlive &&
                    Math.abs(p.position.x - updatedAiUnit.position.x) +
                      Math.abs(p.position.y - updatedAiUnit.position.y) <=
                      aiUnit.attackRange
                );

                if (inRange) {
                  const nearestTarget = playerUnits
                    .filter((p) => p.isAlive)
                    .sort((a, b) => {
                      const distA =
                        Math.abs(a.position.x - updatedAiUnit.position.x) +
                        Math.abs(a.position.y - updatedAiUnit.position.y);
                      const distB =
                        Math.abs(b.position.x - updatedAiUnit.position.x) +
                        Math.abs(b.position.y - updatedAiUnit.position.y);
                      return distA - distB;
                    })[0];

                  if (nearestTarget) {
                    const result = attackUnit(aiUnit.id, nearestTarget.id);
                    if (result) {
                      setAttackingUnits((prev) => [
                        ...prev,
                        {
                          attackerId: aiUnit.id,
                          targetId: nearestTarget.id,
                          damage: result.damage,
                        },
                      ]);

                      if (result.isKilled) {
                        setTimeout(() => {
                          setDyingUnits((prev) => [...prev, nearestTarget.id]);
                        }, 200);
                      }

                      await new Promise((resolve) => setTimeout(resolve, 800));

                      setAttackingUnits((prev) =>
                        prev.filter(
                          (a) => a.attackerId !== aiUnit.id || a.targetId !== nearestTarget.id
                        )
                      );
                    }
                  }
                }
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          await new Promise((resolve) => setTimeout(resolve, 500));

          const finalUnits = useGameStore.getState().units;
          finalUnits.forEach((u) => {
            if (u.team === 'ai') {
              u.hasMoved = false;
              u.hasAttacked = false;
            }
          });

          useGameStore.setState({
            units: finalUnits.map((u) =>
              u.team === 'ai'
                ? { ...u, hasMoved: false, hasAttacked: false }
                : u
            ),
            currentTurn: 'player',
            gamePhase: 'player-turn',
            message: '玩家回合 - 选择一个单位',
          });

          setDyingUnits([]);
        } catch (error) {
          console.error('AI回合执行失败:', error);
          setGamePhase('player-turn');
        }
      };

      runAiTurn();
    }
  }, [gamePhase, currentTurn]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">⚔️ 战棋AI决策模拟</h1>
      </header>

      <main className="app-main">
        <div className="game-area">
          <MapGrid
            onMoveUnit={handleMoveUnit}
            onAttackUnit={handleAttackUnit}
            movingUnit={movingUnit}
            attackingUnits={attackingUnits}
            dyingUnits={dyingUnits}
            aiPath={aiPath}
          />
          <UnitPanel />
        </div>

        <StatusPanel />
      </main>
    </div>
  );
};

export default App;
