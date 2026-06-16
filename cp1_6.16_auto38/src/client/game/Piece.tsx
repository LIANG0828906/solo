import React from 'react';
import { Piece, PieceColor, Position } from '../../shared/types';
import { PIECE_NAMES } from '../../shared/types';

interface PieceComponentProps {
  piece: Piece;
  pos: Position;
  isSelected: boolean;
  isMyPiece: boolean;
  isMyTurn: boolean;
  pixelPos: { x: number; y: number };
  isDragging: boolean;
  dragPixelPos: { x: number; y: number } | null;
  onClick: (pos: Position) => void;
  onDragStart: (pos: Position, e: React.MouseEvent) => void;
}

const PieceComponent: React.FC<PieceComponentProps> = ({
  piece,
  pos,
  isSelected,
  isMyPiece,
  isMyTurn,
  pixelPos,
  isDragging,
  dragPixelPos,
  onClick,
  onDragStart,
}) => {
  const name = PIECE_NAMES[piece.type][piece.color];
  const isDragTarget = isDragging && isSelected;
  const style: React.CSSProperties = isDragTarget && dragPixelPos
    ? {
        left: dragPixelPos.x - 24,
        top: dragPixelPos.y - 24,
        transition: 'none',
      }
    : {
        left: pixelPos.x - 24,
        top: pixelPos.y - 24,
      };

  return (
    <div
      className={`piece ${piece.color} ${isSelected ? 'selected' : ''} ${isDragTarget ? 'dragging' : ''}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick(pos);
      }}
      onMouseDown={(e) => {
        if (isMyPiece && isMyTurn) {
          onDragStart(pos, e);
        }
      }}
    >
      {name}
    </div>
  );
};

export default PieceComponent;
