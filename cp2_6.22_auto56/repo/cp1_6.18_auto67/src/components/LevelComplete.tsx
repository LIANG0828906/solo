import React from 'react';

interface LevelCompleteProps {
  level: number;
  correctCount: number;
  totalCount: number;
  score: number;
  difficulty: string;
  onNext: () => void;
}

const LevelComplete: React.FC<LevelCompleteProps> = ({
  level,
  correctCount,
  totalCount,
  score,
  difficulty,
  onNext,
}) => {
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  const accuracyPercent = Math.round(accuracy * 100);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - accuracy);

  const getDifficultyTip = () => {
    if (accuracyPercent >= 80) {
      return {
        style: {
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '24px',
          background: 'rgba(107,203,119,0.15)',
          color: '#6BCB77',
          border: '1px solid #6BCB77',
        } as React.CSSProperties,
        text: '表现优秀！难度将提升 ⬆️',
      };
    } else if (accuracyPercent < 40) {
      return {
        style: {
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '24px',
          background: 'rgba(255,107,107,0.15)',
          color: '#FF6B6B',
          border: '1px solid #FF6B6B',
        } as React.CSSProperties,
        text: '需要加油！难度将降低 ⬇️',
      };
    } else {
      return {
        style: {
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '24px',
          background: 'rgba(78,205,196,0.15)',
          color: '#4ECDC4',
          border: '1px solid #4ECDC4',
        } as React.CSSProperties,
        text: '稳步前进，继续保持！',
      };
    }
  };

  const difficultyTip = getDifficultyTip();

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
    width: '320px',
    background: '#0F2027',
    borderRadius: '12px',
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '1px solid rgba(78,205,196,0.2)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#4ECDC4',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#94A3B8',
    marginBottom: '24px',
  };

  const progressWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '160px',
    height: '160px',
    margin: '0 auto 24px',
  };

  const centerTextStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 700,
    color: '#4ECDC4',
  };

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '32px',
    padding: '16px',
    background: '#1E293B',
    borderRadius: '8px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '4px',
  };

  const correctValueStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#6BCB77',
    fontWeight: 600,
  };

  const scoreValueStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#FFD93D',
    fontWeight: 600,
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={titleStyle}>第 {level} 关完成！</div>
        <div style={subtitleStyle}>当前难度：{difficulty}</div>

        <div style={progressWrapperStyle}>
          <svg viewBox="0 0 100 100" width="160" height="160">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#2D4A6C"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="8"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div style={centerTextStyle}>{accuracyPercent}%</div>
        </div>

        <div style={statsRowStyle}>
          <div>
            <div style={statLabelStyle}>正确数</div>
            <div style={correctValueStyle}>{correctCount}/{totalCount}</div>
          </div>
          <div>
            <div style={statLabelStyle}>本关得分</div>
            <div style={scoreValueStyle}>{score}</div>
          </div>
        </div>

        <div style={difficultyTip.style}>{difficultyTip.text}</div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={onNext}
        >
          下一关
        </button>
      </div>
    </div>
  );
};

export default LevelComplete;
