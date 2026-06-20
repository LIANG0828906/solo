import React, { useState, useCallback } from 'react';
import { BoardCard, Position, TurnPlayer } from '../card/CardTypes';
import { CardItem } from '../../components/CardItem';
import { BOARD_ROWS, BOARD_COLS, getCardAtPosition, getEmptyPositions } from '../card/CardDeck';

interface GameBoardProps {
  playerBoard: BoardCard[];
  aiBoard: BoardCard[];
  currentTurn: TurnPlayer;
  selectedBoardCardId: string | null;
  dragCard: { index: number; cost: number } | null;
  playerMana: number;
  onCardClick: (card: BoardCard) => void;
  onCellDrop: (position: Position) => void;
  onCellDragOver: (e: React.DragEvent, position: Position) => void;
  canPlayCard?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  playerBoard,
  aiBoard,
  currentTurn,
  selectedBoardCardId,
  dragCard,
  playerMana,
  onCardClick,
  onCellDrop,
  onCellDragOver,
  canPlayCard = true,
}) => {
  const allCards = [...playerBoard, ...aiBoard];
  const playerEmptyPositions = getEmptyPositions(allCards, 'player');
  const [dropTarget, setDropTarget] = useState<Position | null>(null);

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
              ${card.owner === 'player' ? '' : ''}
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
    <div className="relative p-4 rounded-xl" style={{
      background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.9) 0%, rgba(20, 20, 40, 0.95) 100%)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.1)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
    }}>
      <div className="text-center mb-2">
        <span className="text-gray-400 text-sm">AI 区域</span>
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, 80px)`,
          gridTemplateRows: `repeat(${BOARD_ROWS}, 80px)`,
        }}
      >
        {Array.from({ length: BOARD_ROWS }, (_, row) =>
          Array.from({ length: BOARD_COLS }, (_, col) => renderCell(row, col))
        )}
      </div>

      <div className="text-center mt-2">
        <span className="text-gray-400 text-sm">玩家区域</span>
      </div>

      <div
        className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
        }}
      />

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
