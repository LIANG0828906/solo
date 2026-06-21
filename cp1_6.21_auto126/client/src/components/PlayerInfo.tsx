import React from 'react';

interface PlayerInfoProps {
  nickname: string;
  onlineCount: number;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ nickname, onlineCount }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      background: 'rgba(30, 41, 59, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{
        fontSize: '18px',
        color: '#E0E0E0',
        fontWeight: 500,
        textShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
        paddingBottom: '2px',
        borderBottom: '3px solid rgba(0, 0, 0, 0.2)',
        lineHeight: 1.4
      }}>
        {nickname}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'rgba(224, 224, 224, 0.7)',
        marginTop: '4px'
      }}>
        在线玩家: <span style={{ color: '#4CAF50', fontWeight: 600 }}>{onlineCount}</span> 人
      </div>
    </div>
  );
};
