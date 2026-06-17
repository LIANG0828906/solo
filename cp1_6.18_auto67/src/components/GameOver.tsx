import React from 'react';

interface GameOverProps {
  totalScore: number;
  farLevel: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  totalScore,
  farLevel,
  onRestart,
}) => {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    animation: 'fadeIn 0.3s ease',
  };

  const panelStyle: React.CSSProperties = {
    width: '400px',
    background: '#1E293B',
    borderRadius: '16px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,107,107,0.2)',
  };

  const titleAreaStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const iconWrapperStyle: React.CSSProperties = {
    marginBottom: '16px',
    opacity: 0.8,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#FF6B6B',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#94A3B8',
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '32px',
  };

  const scoreCardStyle: React.CSSProperties = {
    padding: '24px',
    background: '#0F2027',
    borderRadius: '12px',
    borderTop: '3px solid #FFD93D',
  };

  const levelCardStyle: React.CSSProperties = {
    padding: '24px',
    background: '#0F2027',
    borderRadius: '12px',
    borderTop: '3px solid #4ECDC4',
  };

  const cardLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94A3B8',
  };

  const scoreValueStyle: React.CSSProperties = {
    fontSize: '36px',
    color: '#FFD93D',
    fontWeight: 800,
    marginTop: '8px',
  };

  const levelValueStyle: React.CSSProperties = {
    fontSize: '36px',
    color: '#4ECDC4',
    fontWeight: 800,
    marginTop: '8px',
  };

  const footerTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '20px',
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={titleAreaStyle}>
          <div style={iconWrapperStyle}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF6B6B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" opacity="0.3"/>
              <path d="m12 5-2-2-3 3"/>
              <path d="m12 5 2-2 3 3"/>
              <path d="M12 21V7"/>
              <path d="M2 15a5 5 0 0 1 4-5"/>
              <path d="M22 15a5 5 0 0 0-4-5"/>
              <path d="M19 14 12 21l-7-7"/>
            </svg>
          </div>
          <div style={titleStyle}>游戏结束</div>
          <div style={subtitleStyle}>生命耗尽，但航程永不停歇！</div>
        </div>

        <div style={statsGridStyle}>
          <div style={scoreCardStyle}>
            <div style={cardLabelStyle}>总得分</div>
            <div style={scoreValueStyle}>{totalScore}</div>
          </div>
          <div style={levelCardStyle}>
            <div style={cardLabelStyle}>最远关卡</div>
            <div style={levelValueStyle}>{farLevel}</div>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={onRestart}
        >
          重新启航
        </button>

        <div style={footerTextStyle}>每一次挑战都是成长的机会 💪</div>
      </div>
    </div>
  );
};

export default GameOver;
