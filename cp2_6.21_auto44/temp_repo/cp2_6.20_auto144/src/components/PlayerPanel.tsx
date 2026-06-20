import { useState } from 'react';
import type { Player, EventCardType } from '@/types/game';
import { EVENT_CARD_DEFINITIONS } from '@/GameLogic';
import { useTurnTimer } from '@/hooks/useAnimation';

interface PlayerPanelProps {
  player: Player;
  diceValue: number | null;
  isRolling: boolean;
  onRollDice: () => void;
  onUseEventCard: (type: EventCardType, allyPieceId?: string) => void;
  onMovePiece: (pieceId: string) => void;
  onSkipTurn: () => void;
  collidedPieces: string[];
}

const COLOR_MAP: Record<string, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#2ecc71',
};

const CARD_BORDER_MAP: Record<EventCardType, string> = {
  advance_clear: 'red',
  back_collision: 'blue',
  teleport_teammate: 'green',
};

export default function PlayerPanel({
  player,
  diceValue,
  isRolling,
  onRollDice,
  onUseEventCard,
  onMovePiece,
  onSkipTurn,
  collidedPieces,
}: PlayerPanelProps) {
  const { remainingSeconds } = useTurnTimer(player.turnStartTime, onSkipTurn, true);
  const [teleportDropdown, setTeleportDropdown] = useState<string | null>(null);

  const onBoardPieces = player.pieces.filter(
    (p) => !p.isFinished && p.position >= 0
  );

  const handleCardClick = (type: EventCardType) => {
    if (diceValue !== null) return;
    if (type === 'teleport_teammate' && onBoardPieces.length > 1) {
      setTeleportDropdown(teleportDropdown === type ? null : type);
      return;
    }
    onUseEventCard(type);
  };

  const handleAllySelect = (pieceId: string) => {
    onUseEventCard('teleport_teammate', pieceId);
    setTeleportDropdown(null);
  };

  const timerColor = remainingSeconds < 10 ? '#e74c3c' : '#d4af37';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderRadius: '12px',
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: COLOR_MAP[player.color],
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 'bold' }}>{player.name}</span>
        <span style={{ color: timerColor, fontSize: 14 }}>
          ⏱ {remainingSeconds}s
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
        {diceValue === null && !isRolling && (
          <button
            onClick={onRollDice}
            style={{
              background: '#d4af37',
              color: '#1a1a1a',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            掷骰子
          </button>
        )}
        {diceValue !== null && !isRolling && (
          <span style={{ color: '#d4af37', fontSize: 14 }}>选择棋子移动</span>
        )}
        {isRolling && (
          <span style={{ color: 'gray', fontSize: 14 }}>骰子旋转中...</span>
        )}
        <button
          onClick={onSkipTurn}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid gray',
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          跳过回合
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, position: 'relative' }}>
        {player.eventCards.map((type, index) => (
          <div key={`${type}-${index}`} style={{ position: 'relative' }}>
            <div
              onClick={() => handleCardClick(type)}
              style={{
                width: 50,
                height: 30,
                border: `2px solid ${CARD_BORDER_MAP[type]}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                cursor: diceValue === null ? 'pointer' : 'not-allowed',
                opacity: diceValue === null ? 1 : 0.5,
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              {EVENT_CARD_DEFINITIONS[type].name.slice(0, 2)}
            </div>
            {teleportDropdown === type && type === 'teleport_teammate' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  background: 'rgba(0,0,0,0.85)',
                  borderRadius: '6px',
                  padding: '4px',
                  zIndex: 10,
                  minWidth: 80,
                }}
              >
                {onBoardPieces.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => handleAllySelect(piece.id)}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: 11,
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    棋子 {piece.id.slice(0, 4)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
