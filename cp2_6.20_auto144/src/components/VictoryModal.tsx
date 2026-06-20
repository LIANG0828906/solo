import React from 'react';
import type { Player } from '@/types/game';

interface VictoryModalProps {
  winner: Player;
  players: Player[];
  onRestart: () => void;
}

const COLOR_MAP: Record<string, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#2ecc71',
};

const POSITION_LABELS = ['1st', '2nd', '3rd', '4th'];

const VictoryModal: React.FC<VictoryModalProps> = ({ winner, players, onRestart }) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const aFinished = a.pieces.filter((p) => p.isFinished).length;
    const bFinished = b.pieces.filter((p) => p.isFinished).length;
    return bFinished - aFinished;
  });

  return (
    <>
      <style>{`
        @keyframes victoryPulse {
          0%, 100% { box-shadow: 0 0 20px gold, 0 0 40px rgba(212, 175, 55, 0.4); }
          50% { box-shadow: 0 0 40px gold, 0 0 80px rgba(212, 175, 55, 0.6); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 16,
            padding: 32,
            background: 'linear-gradient(135deg, #f7dc6f, #d4af37, #b7950b, #d4af37)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: COLOR_MAP[winner.color] || winner.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'victoryPulse 2s ease-in-out infinite',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 32,
                textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {winner.name.charAt(0)}
            </span>
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 'bold',
              color: '#2c1a00',
              marginBottom: 8,
            }}
          >
            🏆 胜利！
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#3e2200',
              marginBottom: 24,
            }}
          >
            {winner.name}
          </div>

          <div
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            {sortedPlayers.map((player, index) => {
              const finishedCount = player.pieces.filter((p) => p.isFinished).length;
              const isWinner = player.id === winner.id;

              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: index < sortedPlayers.length - 1 ? 8 : 0,
                    borderRadius: 8,
                    background: isWinner ? 'rgba(255,215,0,0.4)' : 'transparent',
                    border: isWinner ? '2px solid gold' : '2px solid transparent',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: 14,
                      color: '#3e2200',
                      width: 32,
                      textAlign: 'left',
                    }}
                  >
                    {POSITION_LABELS[index]}
                  </span>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: COLOR_MAP[player.color] || player.color,
                      display: 'inline-block',
                      marginRight: 8,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      fontSize: 14,
                      fontWeight: isWinner ? 'bold' : 'normal',
                      color: '#3e2200',
                    }}
                  >
                    {player.name}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: '#3e2200',
                      fontWeight: 'bold',
                    }}
                  >
                    {finishedCount}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onRestart}
            style={{
              background: '#2c1a00',
              color: '#d4af37',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s, filter 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
            }}
          >
            重新开始
          </button>
        </div>
      </div>
    </>
  );
};

export default VictoryModal;
