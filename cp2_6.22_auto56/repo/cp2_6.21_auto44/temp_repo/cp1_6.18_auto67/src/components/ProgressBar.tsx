import React from 'react';

interface ProgressBarProps {
  total: number;
  current: number;
  answered: boolean[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ total, current, answered }) => {
  const answeredCount = answered.filter(Boolean).length;
  const progressPercent = (answeredCount / total) * 100;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    position: 'relative',
    padding: '20px 0',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '12px',
    textAlign: 'right',
  };

  const trackStyle: React.CSSProperties = {
    height: '8px',
    background: '#E0E0E0',
    borderRadius: '4px',
    overflow: 'visible',
    position: 'relative',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    background: '#4ECDC4',
    borderRadius: '4px',
    width: `${progressPercent}%`,
    transition: 'width 0.3s ease-out',
  };

  const getDotStyle = (index: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: `${((index + 0.5) / total) * 100}%`,
      borderRadius: '50%',
    };

    if (index === current) {
      return {
        ...baseStyle,
        width: '12px',
        height: '12px',
        background: '#4ECDC4',
        transform: 'translate(-50%, -50%)',
        animation: 'pulse 1.5s infinite',
        zIndex: 2,
      };
    }

    if (answered[index] === true) {
      return {
        ...baseStyle,
        width: '8px',
        height: '8px',
        background: '#6BCB77',
        transform: 'translate(-50%, -50%)',
      };
    }

    if (answered[index] === false) {
      return {
        ...baseStyle,
        width: '8px',
        height: '8px',
        background: '#FF6B6B',
        transform: 'translate(-50%, -50%)',
      };
    }

    return {
      ...baseStyle,
      width: '8px',
      height: '8px',
      background: 'white',
      border: '2px solid #94A3B8',
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>第 {current + 1}/{total} 题</div>
      <div style={trackStyle}>
        <div style={fillStyle} />
        {Array.from({ length: total }, (_, index) => (
          <div key={index} style={getDotStyle(index)} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(78, 205, 196, 0.6);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(78, 205, 196, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
