import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { DungeonManager } from './DungeonManager';
import { CombatEngine } from '../combat/CombatEngine';
import EventModal from '../../components/EventModal';
import type { DungeonCell, GameEvent, EventResult } from '../../types';
import './DungeonUI.css';

function DungeonUI() {
  const navigate = useNavigate();
  const {
    dungeon,
    setDungeon,
    movePlayer,
    character,
    startCombat,
    currentEvent,
    setCurrentEvent,
    applyEventResult,
  } = useGameStore();

  const [selectedCell, setSelectedCell] = useState<DungeonCell | null>(null);
  const [showEvent, setShowEvent] = useState(false);

  useEffect(() => {
    if (!dungeon) {
      const newDungeon = DungeonManager.generateDungeon(5, 5, 1);
      setDungeon(newDungeon);
    }
  }, [dungeon, setDungeon]);

  const handleCellClick = useCallback(
    (cell: DungeonCell) => {
      if (!dungeon || !character) return;
      if (cell.status === 'hidden') return;

      if (DungeonManager.canMoveTo(dungeon, cell.x, cell.y)) {
        movePlayer(cell.x, cell.y);

        if (!cell.cleared && cell.type !== 'empty') {
          const event = DungeonManager.getCellEvent(cell);
          if (event) {
            setCurrentEvent(event);
            setSelectedCell(cell);
            setShowEvent(true);
          }
        }
      }
    },
    [dungeon, character, movePlayer, setCurrentEvent]
  );

  const handleEventOption = (optionId: string) => {
    if (!currentEvent || !character) return;

    const option = currentEvent.options.find((o) => o.id === optionId);
    if (!option) return;

    let result: EventResult;

    if (option.requiredCheck) {
      const checkResult = CombatEngine.rollAbilityCheck(
        character,
        option.requiredCheck.attribute,
        option.requiredCheck.dc
      );

      if (checkResult.success) {
        result = option.result;
      } else {
        result = {
          success: false,
          message: '检定失败！',
        };
      }
    } else {
      result = option.result;
    }

    applyEventResult(result);

    if (result.triggerCombat && result.enemy) {
      startCombat(result.enemy);
      setShowEvent(false);
      setCurrentEvent(null);
      navigate('/game/combat');
    }
  };

  const handleCloseEvent = () => {
    setShowEvent(false);
    setCurrentEvent(null);
    setSelectedCell(null);

    if (dungeon && selectedCell) {
      const newCells = dungeon.cells.map((row) =>
        row.map((cell) =>
          cell.x === selectedCell.x && cell.y === selectedCell.y
            ? { ...cell, cleared: true }
            : cell
        )
      );
      setDungeon({ ...dungeon, cells: newCells });
    }
  };

  const regenerateDungeon = () => {
    const newDungeon = DungeonManager.generateDungeon(5, 5, (dungeon?.floor || 0) + 1);
    setDungeon(newDungeon);
  };

  if (!dungeon) {
    return (
      <div className="dungeon-container loading">
        <div className="parchment-panel">
          <p>正在生成地牢...</p>
        </div>
      </div>
    );
  }

  const cellTypeIcons: Record<string, string> = {
    entrance: '🚪',
    exit: '🏁',
    treasure: '📦',
    trap: '⚠️',
    monster: '👹',
    npc: '💬',
    boss: '👑',
    empty: '',
  };

  return (
    <div className="dungeon-container">
      <div className="dungeon-header">
        <h2>🗺️ 地牢 - 第 {dungeon.floor} 层</h2>
        <button className="btn-secondary" onClick={regenerateDungeon}>
          🔄 新地牢
        </button>
      </div>

      <div className="dungeon-map-container">
        <div className="dungeon-map">
          {dungeon.cells.map((row, y) => (
            <div key={y} className="dungeon-row">
              {row.map((cell, x) => {
                const isPlayer =
                  dungeon.playerPosition.x === x && dungeon.playerPosition.y === y;
                const isAdjacent = DungeonManager.canMoveTo(dungeon, x, y);
                const isRevealed = cell.status !== 'hidden';

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`dungeon-cell ${cell.status} ${isAdjacent ? 'adjacent' : ''} ${isPlayer ? 'player' : ''} ${cell.cleared ? 'cleared' : ''} cell-type-${cell.type}`}
                    onClick={() => handleCellClick(cell)}
                  >
                    {isPlayer ? (
                      <div
                        className="player-marker"
                        style={{ backgroundColor: character?.avatarColor || '#e74c3c' }}
                      >
                        {character?.name.charAt(0).toUpperCase() || '英'}
                      </div>
                    ) : isRevealed ? (
                      <span className="cell-icon">
                        {cell.cleared && cell.type !== 'entrance'
                          ? '✓'
                          : cellTypeIcons[cell.type]}
                      </span>
                    ) : (
                      <span className="fog">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="dungeon-legend">
        <span><span className="legend-icon">🚪</span> 入口</span>
        <span><span className="legend-icon">📦</span> 宝箱</span>
        <span><span className="legend-icon">⚠️</span> 陷阱</span>
        <span><span className="legend-icon">👹</span> 怪物</span>
        <span><span className="legend-icon">💬</span> NPC</span>
        <span><span className="legend-icon">👑</span> BOSS</span>
      </div>

      <div className="dungeon-info parchment-panel">
        <p className="hint-text">
          💡 点击相邻的格子移动。探索地牢，击败怪物，找到出口！
        </p>
      </div>

      {showEvent && currentEvent && (
        <EventModal
          event={currentEvent}
          onSelectOption={handleEventOption}
          onClose={handleCloseEvent}
        />
      )}
    </div>
  );
}

export default DungeonUI;
