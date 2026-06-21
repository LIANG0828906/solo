import React from 'react';
import { PlayerData } from '../types';

interface OnlineListProps {
  players: PlayerData[];
  currentPlayerId: string;
}

export const OnlineList: React.FC<OnlineListProps> = ({ players, currentPlayerId }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px',
      borderRadius: '8px',
      background: 'rgba(30, 41, 59, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      minWidth: '180px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#E0E0E0',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        在线玩家 ({players.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              background: player.avatarColor,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }} />
            <div style={{
              fontSize: '13px',
              color: '#FFFFFF',
              fontWeight: player.id === currentPlayerId ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {player.nickname}
              {player.id === currentPlayerId && (
                <span style={{ color: '#4CAF50', marginLeft: '4px' }}>(我)</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
