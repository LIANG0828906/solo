import type { Cell as CellType, Piece, PlayerColor } from '@/types/game';
import PieceComponent from './Piece';

const zoneColors: Record<string, string> = {
  red: 'rgba(231, 76, 60, 0.7)',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#2ecc71',
  center: '#8b7355',
};

const arrowRotation = (cellId: number): number => {
  if (cellId === 6 || cellId === 20) return 0;
  if (cellId === 7 || cellId === 21) return 90;
  if (cellId === 13 || cellId === 27) return 180;
  if (cellId === 14) return 270;
  return 0;
};

type CellProps = {
  cell: CellType;
  pieces: Piece[];
  playerColors: Record<string, PlayerColor>;
  collidedPieces: string[];
  currentPlayerId: string;
  onPieceClick: (pieceId: string) => void;
  diceValue: number | null;
};

export default function CellComponent({
  cell,
  pieces,
  playerColors,
  collidedPieces,
  currentPlayerId,
  onPieceClick,
  diceValue,
}: CellProps) {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        backgroundColor: zoneColors[cell.zone],
        border: '1px solid #d4af37',
        borderRadius: 4,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 3,
          fontSize: 10,
          color: 'rgba(255,255,255,0.8)',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {cell.id}
      </span>

      {cell.specialMark === 'star' && (
        <span
          style={{
            color: '#d4af37',
            fontSize: 16,
            textShadow: '0 0 6px rgba(212,175,55,0.5)',
          }}
        >
          ★
        </span>
      )}

      {cell.specialMark === 'arrow' && (
        <span
          style={{
            color: '#d4af37',
            fontSize: 14,
            display: 'inline-block',
            transform: `rotate(${arrowRotation(cell.id)}deg)`,
            textShadow: '0 0 4px rgba(212,175,55,0.4)',
          }}
        >
          ➤
        </span>
      )}

      {cell.isStart && (
        <span
          style={{
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: 12,
            textShadow: '0 0 4px rgba(255,0,0,0.3)',
          }}
        >
          起
        </span>
      )}

      {cell.isEvent && (
        <span
          style={{
            color: '#9b59b6',
            fontSize: 10,
            position: 'absolute',
            bottom: 2,
            fontWeight: 'bold',
            textShadow: '0 0 4px rgba(155,89,182,0.4)',
          }}
        >
          事
        </span>
      )}

      {pieces.map((piece) => (
        <PieceComponent
          key={piece.id}
          piece={piece}
          color={playerColors[piece.playerId] || 'red'}
          isCollided={collidedPieces.includes(piece.id)}
          onClick={
            diceValue !== null && piece.playerId === currentPlayerId
              ? () => onPieceClick(piece.id)
              : undefined
          }
          isCurrentPlayer={piece.playerId === currentPlayerId}
        />
      ))}
    </div>
  );
}
