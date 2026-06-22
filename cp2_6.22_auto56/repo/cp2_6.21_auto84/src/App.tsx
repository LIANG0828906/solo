import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, HexCoord, Unit } from './types';
import {
  createInitialState,
  deployUnits,
  moveUnit,
  attackUnit,
  useSkill,
  selectSkill,
  skipUnitTurn,
  resetGame,
  getUnitAtPosition,
  removeDamagePopup,
} from './battle/BattleSystem';
import HexBoard from './components/HexBoard';
import UnitPanel from './components/UnitPanel';
import BattleLog from './components/BattleLog';
import VictoryModal from './components/VictoryModal';
import './App.css';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [logOpen, setLogOpen] = useState(false);

  const popupTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const handleDeploy = () => {
    setGameState(prev => deployUnits(prev));
  };

  const handleRestart = () => {
    setGameState(resetGame());
  };

  const handleMoveableCellsUpdate = useCallback((cells: HexCoord[]) => {
    setGameState(prev => ({
      ...prev,
      moveableCells: cells,
    }));
  }, []);

  const handleCellClick = useCallback((coord: HexCoord) => {
    setGameState(prev => {
      if (prev.phase === 'selecting_move') {
        const currentUnit = prev.units.find(u => u.id === prev.currentUnitId);
        if (!currentUnit || currentUnit.hasMoved) return prev;

        const isMoveable = prev.moveableCells.some(
          c => c.q === coord.q && c.r === coord.r
        );
        if (isMoveable) {
          return moveUnit(prev, currentUnit.id, coord);
        }
      }

      if (prev.phase === 'selecting_attack' || prev.phase === 'selecting_skill_target') {
        const targetUnit = getUnitAtPosition(prev.units, coord);
        const currentUnit = prev.units.find(u => u.id === prev.currentUnitId);

        if (targetUnit && currentUnit) {
          const isAttackable = prev.attackableCells.some(
            c => c.q === coord.q && c.r === coord.r
          );

          if (isAttackable && targetUnit.faction !== currentUnit.faction) {
            if (prev.selectedSkillId) {
              return useSkill(prev, currentUnit.id, targetUnit.id);
            } else {
              return attackUnit(prev, currentUnit.id, targetUnit.id);
            }
          }
        }
      }

      return prev;
    });
  }, []);

  const handleUnitClick = useCallback((unit: Unit) => {
    setGameState(prev => {
      if (prev.phase === 'selecting_attack' || prev.phase === 'selecting_skill_target') {
        const currentUnit = prev.units.find(u => u.id === prev.currentUnitId);
        if (currentUnit && unit.faction !== currentUnit.faction) {
          const isAttackable = prev.attackableCells.some(
            c => c.q === unit.position.q && c.r === unit.position.r
          );
          if (isAttackable && !currentUnit.hasAttacked) {
            if (prev.selectedSkillId) {
              return useSkill(prev, currentUnit.id, unit.id);
            }
            return attackUnit(prev, currentUnit.id, unit.id);
          }
        }
      }

      if (prev.phase === 'selecting_move') {
        if (unit.id === prev.currentUnitId) {
          return prev;
        }
      }

      return { ...prev, selectedUnitId: unit.id };
    });
  }, []);

  const handleSkillSelect = useCallback((skillId: string | null) => {
    setGameState(prev => selectSkill(prev, skillId));
  }, []);

  const handleSkipTurn = useCallback(() => {
    setGameState(prev => skipUnitTurn(prev));
  }, []);

  useEffect(() => {
    gameState.damagePopups.forEach(popup => {
      if (!popupTimeoutsRef.current.has(popup.id)) {
        const timeout = setTimeout(() => {
          setGameState(prev => removeDamagePopup(prev, popup.id));
          popupTimeoutsRef.current.delete(popup.id);
        }, 500);
        popupTimeoutsRef.current.set(popup.id, timeout);
      }
    });
  }, [gameState.damagePopups]);

  useEffect(() => {
    return () => {
      popupTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      popupTimeoutsRef.current.clear();
    };
  }, []);

  const selectedUnit = gameState.selectedUnitId
    ? gameState.units.find(u => u.id === gameState.selectedUnitId) || null
    : null;

  const currentUnit = gameState.currentUnitId
    ? gameState.units.find(u => u.id === gameState.currentUnitId) || null
    : null;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">六边形战棋沙盒</h1>
        <div className="header-info">
          {gameState.phase !== 'idle' && gameState.phase !== 'game_over' && (
          <div className="turn-info">
            <span className="turn-label">第 {gameState.currentTurn} 回合</span>
            <span className={`faction-indicator ${gameState.currentFaction}`}>
              {gameState.currentFaction === 'blue' ? '蓝方' : '红方'}行动
            </span>
          </div>
        )}
        {gameState.phase === 'idle' && (
          <button className="deploy-button" onClick={handleDeploy}>
            开始部署
          </button>
        )}
        {gameState.phase !== 'idle' && gameState.phase !== 'game_over' && (
          <button className="restart-button-small" onClick={handleRestart}>
          重新开始
        </button>
        )}
        </div>
      </header>

      <main className="main-content">
        <aside className="left-panel">
          <UnitPanel
            gameState={gameState}
            selectedUnit={selectedUnit}
            currentUnitId={gameState.currentUnitId}
            onSkillSelect={handleSkillSelect}
            selectedSkillId={gameState.selectedSkillId}
            onSkipTurn={handleSkipTurn}
            onUnitClick={handleUnitClick}
          />
        </aside>

        <section className="board-container">
          {currentUnit && gameState.phase !== 'idle' && gameState.phase !== 'game_over' && (
          <div className="current-unit-hint">
            当前行动: <strong>{currentUnit.name}</strong>
            {gameState.phase === 'selecting_move' && !currentUnit.hasMoved && ' - 点击蓝色区域移动'}
            {gameState.phase === 'selecting_attack' && !currentUnit.hasAttacked && ' - 点击红色区域攻击'}
            {gameState.phase === 'selecting_skill_target' && ' - 选择技能目标'}
          </div>
        )}
          <HexBoard
            gameState={gameState}
            onCellClick={handleCellClick}
            onUnitClick={handleUnitClick}
            onMoveableCellsUpdate={handleMoveableCellsUpdate}
          />
        </section>

        <aside className="right-panel">
          <BattleLog logs={gameState.logs} />
        </aside>

        <button
          className="mobile-log-toggle"
          onClick={() => setLogOpen(!logOpen)}
        >
          📜 日志
        </button>

        {logOpen && (
          <div className="mobile-log-drawer">
            <div className="drawer-header">
              <span>战斗日志</span>
              <button onClick={() => setLogOpen(false)}>✕</button>
            </div>
            <BattleLog logs={gameState.logs} />
          </div>
        )}
      </main>

      <VictoryModal winner={gameState.winner} onRestart={handleRestart} />
    </div>
  );
};

export default App;
