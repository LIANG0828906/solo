import React, { useState, useCallback } from 'react';
import { BoardCard, Position, TurnPlayer } from '../card/CardTypes';
import { CardItem } from '../../components/CardItem';
import { BOARD_ROWS, BOARD_COLS, getCardAtPosition, getEmptyPositions } from '../card/CardDeck';
import { Heart } from 'lucide-react';

interface GameBoardProps {
  playerBoard: BoardCard[];
  aiBoard: BoardCard[];
  playerHealth: number;
  playerMaxHealth: number;
  aiHealth: number;
  aiMaxHealth: number;
  currentTurn: TurnPlayer;
  selectedBoardCardId: string | null;
  dragCard: { index: number; cost: number } | null;
  playerMana: number;
  battleEvents?: Set<string>;
  recentlyDamaged?: Set<string>;
  onCardClick: (card: BoardCard) => void;
  onCellDrop: (position: Position) => void;
  onCellDragOver: (e: React.DragEvent, position: Position) => void;
  canPlayCard?: boolean;
}

function HealthBar({
  health,
  maxHealth,
  position,
  isPlayer,
}: {
  health: number;
  maxHealth: number;
  position: 'left' | 'right';
  isPlayer: boolean;
}) {
  const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const barColor = isPlayer
    ? 'linear-gradient(0deg, #3b82f6, #60a5fa, #93c5fd)'
    : 'linear-gradient(0deg, #ef4444, #f87171, #fca5a5)';
  const label = isPlayer ? '玩家' : 'AI';
  const labelColor = isPlayer ? '#60a5fa' : '#f87171';

  return (
    <div
      className={`hidden md:flex flex-col justify-center items-center w-16 shrink-0 health-bar-container ${
        position === 'left' ? 'pr-1' : 'pl-1'
      }`}
    >
      <div className="mb-2 flex items-center gap-1">
        <Heart
          size={16}
          style={{ color: labelColor, fill: `${labelColor}40` }}
        />
        <span
          className="text-xs font-bold"
          style={{ color: labelColor }}
        >
          {label}
        </span>
      </div>

      <div
        className="w-7 rounded-full overflow-hidden relative my-2"
        style={{
          background: 'rgba(30, 30, 50, 0.8)',
          border: `1px solid ${isPlayer ? 'rgba(96, 165, 250, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
          height: '380px',
          boxShadow: `inset 0 2px 8px rgba(0,0,0,0.5), 0 0 12px ${isPlayer ? 'rgba(96, 165, 250, 0.15)' : 'rgba(248, 113, 113, 0.15)'}`,
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{
            height: `${percent}%`,
            background: barColor,
            boxShadow: `0 0 12px ${isPlayer ? 'rgba(96, 165, 250, 0.6)' : 'rgba(248, 113, 113, 0.6)'}`,
          }}
        />
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute left-0 right-0 h-px z-10"
            style={{
              bottom: `${mark}%`,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      <div
        className="text-center mt-2 font-bold text-lg px-2 py-1 rounded-lg"
        style={{
          color: labelColor,
          background: 'rgba(20, 20, 40, 0.8)',
          border: `1px solid ${isPlayer ? 'rgba(96, 165, 250, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
          minWidth: '56px',
          textShadow: `0 0 8px ${isPlayer ? 'rgba(96, 165, 250, 0.5)' : 'rgba(248, 113, 113, 0.5)'}`,
        }}
      >
        {health}
        <span className="text-xs text-gray-400 font-normal">/{maxHealth}</span>
      </div>
    </div>
  );
}

export const GameBoard: React.FC<GameBoardProps> = ({
  playerBoard,
  aiBoard,
  playerHealth,
  playerMaxHealth,
  aiHealth,
  aiMaxHealth,
  currentTurn,
  selectedBoardCardId,
  dragCard,
  playerMana,
  battleEvents = new Set(),
  recentlyDamaged = new Set(),
  onCardClick,
  onCellDrop,
  onCellDragOver,
  canPlayCard = true,
}) => {
  const allCards = [...playerBoard, ...aiBoard];
  const playerEmptyPositions = getEmptyPositions(allCards, 'player');
  const [dropTarget, setDropTarget] = useState<Position | null>(null);

  const hasAttackEvent = (cardId: string): boolean => {
    return [...battleEvents].some(ev => ev.startsWith('attack_') && ev.includes(cardId));
  };

  const canDropAtPosition = (position: Position): boolean => {
    if (!dragCard) return false;
    if (currentTurn !== TurnPlayer.PLAYER) return false;
    if (dragCard.cost > playerMana) return false;
    return playerEmptyPositions.some(
      (p) => p.row === position.row && p.col === position.col
    );
  };

  const handleDragOver = useCallback((e: React.DragEvent, position: Position) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(position);
    onCellDragOver(e, position);
  }, [onCellDragOver]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, position: Position) => {
    e.preventDefault();
    setDropTarget(null);
    onCellDrop(position);
  }, [onCellDrop]);

  const renderCell = (row: number, col: number) => {
    const position = { row, col };
    const card = getCardAtPosition(allCards, position);
    const isPlayerSide = row >= 3;
    const isEmpty = !card;
    const canDrop = canDropAtPosition(position);

    const isDraggingOver = dropTarget && dropTarget.row === row && dropTarget.col === col;
    const isHighlighted = dragCard && isPlayerSide && isEmpty && canDrop;
    const isInvalid = dragCard && isPlayerSide && isEmpty && !canDrop;

    const isAttacking = card ? hasAttackEvent(card.instanceId) : false;
    const isDamaged = card ? recentlyDamaged.has(card.instanceId) : false;

    let cellBg: React.CSSProperties = {};
    if (card) {
      cellBg = { background: 'transparent' };
    } else if (isDraggingOver && isHighlighted) {
      cellBg = {
        background: 'rgba(34, 197, 94, 0.4)',
        boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.3)',
      };
    } else if (isDraggingOver && isInvalid) {
      cellBg = {
        background: 'rgba(239, 68, 68, 0.4)',
        boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.3)',
      };
    } else if (isHighlighted) {
      cellBg = {
        background: 'rgba(34, 197, 94, 0.25)',
        boxShadow: 'inset 0 0 12px rgba(34, 197, 94, 0.2)',
      };
    } else if (isInvalid) {
      cellBg = {
        background: 'rgba(239, 68, 68, 0.15)',
      };
    } else {
      cellBg = {
        background: 'linear-gradient(135deg, rgba(42, 42, 74, 0.5) 0%, rgba(26, 26, 46, 0.5) 100%)',
      };
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`
          relative rounded-lg transition-all duration-200
          flex items-center justify-center
          ${isEmpty && !isHighlighted && !isInvalid ? 'border border-dashed border-gray-600/50' : ''}
          ${isHighlighted && !isDraggingOver ? 'border-2 border-solid border-green-400' : ''}
          ${isDraggingOver && isHighlighted ? 'border-2 border-solid border-green-300 scale-105' : ''}
          ${isInvalid && !isDraggingOver ? 'border-2 border-solid border-red-400/60' : ''}
          ${isDraggingOver && isInvalid ? 'border-2 border-solid border-red-400' : ''}
        `}
        style={{
          width: '80px',
          height: '80px',
          ...cellBg,
        }}
        onDragOver={(e) => handleDragOver(e, position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, position)}
      >
        {card && (
          <div
            className={`
              card-enter
            `}
          >
            <CardItem
              card={card}
              size="small"
              isSelected={selectedBoardCardId === card.instanceId}
              canAttack={
                card.owner === 'player' &&
                card.canAttack &&
                !card.hasAttacked &&
                !card.isFrozen &&
                currentTurn === TurnPlayer.PLAYER
              }
              isAttacking={isAttacking}
              isDamaged={isDamaged}
              showStatsOnCard={true}
              onClick={() => onCardClick(card)}
              draggable={false}
              showTooltip={true}
            />
          </div>
        )}

        {isEmpty && isHighlighted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-dashed border-green-400 rounded-full animate-pulse opacity-60" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative mx-auto rounded-xl" style={{
      background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.9) 0%, rgba(20, 20, 40, 0.95) 100%)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.1)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      padding: '12px',
      display: 'inline-block',
    }}>
      <div className="flex items-stretch">
        <HealthBar
          health={aiHealth}
          maxHealth={aiMaxHealth}
          position="left"
          isPlayer={false}
        />

        <div className="relative flex flex-col px-2">
          <div className="text-center mb-1">
            <span className="text-gray-400 text-sm">AI 区域</span>
          </div>

          <div
            className="grid gap-1 mx-auto relative"
            style={{
              gridTemplateColumns: `repeat(${BOARD_COLS}, 80px)`,
              gridTemplateRows: `repeat(${BOARD_ROWS}, 80px)`,
              width: `calc(${BOARD_COLS} * 80px + (${BOARD_COLS - 1}) * 4px)`,
            }}
          >
            {Array.from({ length: BOARD_ROWS }, (_, row) =>
              Array.from({ length: BOARD_COLS }, (_, col) => renderCell(row, col))
            )}

            <div
              className="absolute left-0 right-0 h-0.5 pointer-events-none"
              style={{
                top: `calc(${BOARD_ROWS / 2} * (80px + 4px) - 2px)`,
                background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.35), transparent)',
              }}
            />
          </div>

          <div className="text-center mt-1">
            <span className="text-gray-400 text-sm">玩家区域</span>
          </div>
        </div>

        <HealthBar
          health={playerHealth}
          maxHealth={playerMaxHealth}
          position="right"
          isPlayer={true}
        />
      </div>

      <style>{`
        @keyframes cardFlyIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(60px);
          }
          60% {
            opacity: 1;
            transform: scale(1.15) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .card-enter {
          animation: cardFlyIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};
