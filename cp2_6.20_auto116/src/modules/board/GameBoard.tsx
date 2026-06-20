import React from 'react';
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

  const canDropAtPosition = (position: Position): boolean => {
    if (!dragCard) return false;
    if (currentTurn !== TurnPlayer.PLAYER) return false;
    if (dragCard.cost > playerMana) return false;
    return playerEmptyPositions.some(
      (p) => p.row === position.row && p.col === position.col
    );
  };

  const renderCell = (row: number, col: number) => {
    const position = { row, col };
    const card = getCardAtPosition(allCards, position);
    const isPlayerSide = row >= 3;
    const canDrop = canDropAtPosition(position);
    const isEmpty = !card;

    const isHighlighted =
      dragCard && isPlayerSide && isEmpty && canDrop;
    const isInvalid =
      dragCard && isPlayerSide && isEmpty && !canDrop && playerMana < (dragCard?.cost || 0);

    return (
      <div
        key={`${row}-${col}`}
        className={`
          relative w-20 h-20 rounded-lg transition-all duration-200
          flex items-center justify-center
          ${card ? '' : 'border border-dashed border-gray-600/50'}
          ${isHighlighted ? 'bg-green-500/30 border-green-400 border-solid' : ''}
          ${isInvalid ? 'bg-red-500/30 border-red-400 border-solid' : ''}
        `}
        style={{
          background: card
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(42, 42, 74, 0.5) 0%, rgba(26, 26, 46, 0.5) 100%)',
        }}
        onDragOver={(e) => onCellDragOver(e, position)}
        onDrop={() => onCellDrop(position)}
      >
        {card && (
          <div
            className={`
              transform transition-all duration-300
              ${card.owner === 'player' ? 'rotate-0' : 'rotate-180'}
            `}
            style={{
              animation: card ? 'cardEnter 0.3s ease-out' : 'none',
            }}
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-dashed border-green-400 rounded-full animate-pulse" />
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
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)`,
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
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
        }}
      />

      <style>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: scale(0.5) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
