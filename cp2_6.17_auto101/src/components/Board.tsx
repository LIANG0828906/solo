import React, { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Sprite,
  GRID_SIZE,
  ELEMENT_COLORS,
  ELEMENT_EMOJI,
  PLAYER_ROWS,
} from '../types';

const CELL_SIZE = 80;
const CELL_SIZE_SMALL = 60;
const SPRITE_SIZE = 60;
const SPRITE_SIZE_SMALL = 44;

const getHealthBarColor = (ratio: number): string => {
  if (ratio > 0.7) return '#00FF00';
  if (ratio > 0.4) return '#FFFF00';
  return '#FF0000';
};

interface SpriteRendererProps {
  sprite: Sprite;
  cellSize: number;
  spriteSize: number;
}

const SpriteRenderer: React.FC<SpriteRendererProps> = ({
  sprite,
  cellSize,
  spriteSize,
}) => {
  const colors = ELEMENT_COLORS[sprite.element];
  const emoji = ELEMENT_EMOJI[sprite.element];
  const healthRatio = sprite.currentHealth / sprite.maxHealth;
  const healthBarColor = getHealthBarColor(healthRatio);

  const x = sprite.gridX * cellSize + (cellSize - spriteSize) / 2;
  const y = sprite.gridY * cellSize + (cellSize - spriteSize) / 2;

  return (
    <div
      className={`sprite ${sprite.isAppearing ? 'sprite-appear' : ''} ${
        sprite.isShaking ? 'sprite-shake' : ''
      } ${sprite.isFading ? 'sprite-fade' : ''} sprite-${sprite.element}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${spriteSize}px`,
        height: `${spriteSize}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${colors.secondary}, ${colors.primary})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${spriteSize * 0.5}px`,
        boxShadow: `0 0 15px ${colors.primary}80`,
        transition: 'left 0.5s ease, top 0.5s ease, transform 0.3s ease, opacity 0.5s ease',
        zIndex: sprite.owner === 'enemy' ? 5 : 10,
        transform: sprite.isAppearing ? 'scale(0)' : 'scale(1)',
        opacity: sprite.isFading ? 0 : 1,
      }}
    >
      <span style={{ pointerEvents: 'none', userSelect: 'none' }}>{emoji}</span>

      <div
        className="health-bar-container"
        style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${spriteSize * 0.83}px`,
          height: '4px',
          backgroundColor: '#333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          className="health-bar"
          style={{
            width: `${healthRatio * 100}%`,
            height: '100%',
            backgroundColor: healthBarColor,
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>

      <div
        className="owner-indicator"
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: sprite.owner === 'player' ? '#6C63FF' : '#FF4545',
          boxShadow: `0 0 4px ${
            sprite.owner === 'player' ? '#6C63FF' : '#FF4545'
          }`,
        }}
      />

      {sprite.particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            position: 'absolute',
            left: `${spriteSize / 2 + particle.x * 6}px`,
            top: `${spriteSize / 2 + particle.y * 6}px`,
            width: `${particle.radius}px`,
            height: `${particle.radius}px`,
            borderRadius: '50%',
            backgroundColor: particle.color,
            opacity: particle.life,
            boxShadow: `0 0 ${particle.radius * 2}px ${particle.color}`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};

interface BoardProps {
  draggedCardId: string | null;
  onDragEnd: () => void;
}

const Board: React.FC<BoardProps> = ({ draggedCardId, onDragEnd }) => {
  const {
    grid,
    sprites,
    placeCard,
    phase,
    playerGold,
    startBattle,
    battleRound,
    maxBattleRounds,
  } = useGameStore();
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cellSize = isSmallScreen ? CELL_SIZE_SMALL : CELL_SIZE;
  const spriteSize = isSmallScreen ? SPRITE_SIZE_SMALL : SPRITE_SIZE;
  const boardSize = cellSize * GRID_SIZE;
  const canDrag = phase === 'preparation' && playerGold >= 2;

  const handleDragOver = useCallback(
    (e: React.DragEvent, x: number, y: number) => {
      e.preventDefault();
      if (draggedCardId && canDrag) {
        setHoveredCell({ x, y });
      }
    },
    [draggedCardId, canDrag]
  );

  const handleDragLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, x: number, y: number) => {
      e.preventDefault();
      setHoveredCell(null);
      if (draggedCardId && phase === 'preparation') {
        placeCard(draggedCardId, x, y);
        onDragEnd();
      }
    },
    [draggedCardId, phase, placeCard, onDragEnd]
  );

  const isValidPlacement = (x: number, y: number): boolean => {
    return (
      PLAYER_ROWS.includes(y) && grid[y][x].spriteId === null && playerGold >= 2
    );
  };

  const handleStartBattle = () => {
    startBattle();
  };

  const hasPlayerSprites = sprites.some((s) => s.owner === 'player');

  return (
    <div
      className="board-wrapper-outer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isSmallScreen ? '12px' : '16px',
      }}
    >
      {phase === 'preparation' && (
        <div
          className="battle-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isSmallScreen ? '10px' : '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            className="start-battle-btn"
            onClick={handleStartBattle}
            disabled={!hasPlayerSprites}
            style={{
              padding: isSmallScreen ? '12px 24px' : '14px 32px',
              fontSize: isSmallScreen ? '14px' : '16px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: hasPlayerSprites ? '#FF6347' : '#555',
              border: 'none',
              borderRadius: '12px',
              cursor: hasPlayerSprites ? 'pointer' : 'not-allowed',
              transition:
                'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: hasPlayerSprites
                ? '0 4px 20px rgba(255, 99, 71, 0.4)'
                : 'none',
              letterSpacing: '1px',
            }}
            onMouseEnter={(e) => {
              if (hasPlayerSprites) {
                e.currentTarget.style.backgroundColor = '#FF8367';
                e.currentTarget.style.boxShadow =
                  '0 0 8px rgba(255, 99, 71, 0.6), 0 6px 25px rgba(255, 99, 71, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = hasPlayerSprites
                ? '#FF6347'
                : '#555';
              e.currentTarget.style.boxShadow = hasPlayerSprites
                ? '0 4px 20px rgba(255, 99, 71, 0.4)'
                : 'none';
            }}
            onMouseDown={(e) => {
              if (hasPlayerSprites) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ⚔️ 开始战斗
          </button>
          {!hasPlayerSprites && (
            <span
              style={{
                fontSize: isSmallScreen ? '11px' : '13px',
                color: '#FF6347',
              }}
            >
              请先放置至少一个精灵
            </span>
          )}
        </div>
      )}

      {phase === 'battling' && (
        <div
          className="battle-progress"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: isSmallScreen ? '13px' : '15px',
            color: '#FFD700',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
          }}
        >
          <span className="battle-icon">⚔️</span>
          <span>
            战斗进行中 - 第 {battleRound}/{maxBattleRounds} 回合
          </span>
          <span className="battle-icon">⚔️</span>
        </div>
      )}

      <div
        className="board-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          className="board"
          style={{
            position: 'relative',
            width: `${boardSize}px`,
            height: `${boardSize}px`,
            backgroundColor: '#1E2A3A',
            borderRadius: '8px',
            padding: '4px',
            boxShadow: '0 0 30px rgba(108, 99, 255, 0.2)',
          }}
        >
          <div
            className="grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
              gap: '0',
            }}
          >
            {grid.flat().map((cell) => {
              const isHovered =
                hoveredCell?.x === cell.x && hoveredCell?.y === cell.y;
              const isValid = isValidPlacement(cell.x, cell.y);
              const isPlayerRow = PLAYER_ROWS.includes(cell.y);
              const isEnemyRow = cell.y <= 1;

              return (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className={`grid-cell ${
                    isHovered && isValid && canDrag ? 'cell-hovered' : ''
                  } ${isPlayerRow ? 'player-zone' : ''} ${
                    isEnemyRow ? 'enemy-zone' : ''
                  }`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: '#1E2A3A',
                    border: '1px solid #3A4A5C',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor:
                      draggedCardId && canDrag
                        ? isValid
                          ? 'pointer'
                          : 'not-allowed'
                        : 'default',
                    transition:
                      'background-color 0.15s ease, border-color 0.15s ease',
                    ...(isPlayerRow
                      ? { backgroundColor: 'rgba(108, 99, 255, 0.08)' }
                      : {}),
                    ...(isEnemyRow
                      ? { backgroundColor: 'rgba(255, 69, 69, 0.08)' }
                      : {}),
                    ...(isHovered && isValid && canDrag
                      ? {
                          backgroundColor: 'rgba(108, 99, 255, 0.3)',
                          borderColor: '#6C63FF',
                          boxShadow: 'inset 0 0 15px rgba(108, 99, 255, 0.4)',
                        }
                      : {}),
                    ...(isHovered && !isValid && draggedCardId && canDrag
                      ? {
                          backgroundColor: 'rgba(255, 69, 69, 0.2)',
                          borderColor: '#FF4545',
                        }
                      : {}),
                  }}
                  onDragOver={(e) => handleDragOver(e, cell.x, cell.y)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cell.x, cell.y)}
                >
                  {isPlayerRow &&
                    cell.spriteId === null &&
                    phase === 'preparation' && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(108, 99, 255, 0.3)',
                          fontWeight: 'bold',
                        }}
                      >
                        +
                      </span>
                    )}
                </div>
              );
            })}
          </div>

          {sprites.map((sprite) => (
            <SpriteRenderer
              key={sprite.id}
              sprite={sprite}
              cellSize={cellSize}
              spriteSize={spriteSize}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
