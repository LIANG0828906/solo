import React from 'react';
import { useGameStore } from '../state/StateManager';

const GameOverPanel: React.FC = () => {
  const { game, player } = useGameStore();
  const resetGame = useGameStore((s) => s.resetGame);

  const sizeBonus = Math.floor((game.maxSize - 1) * 10 * 5);
  const healthBonus = player.health * 10;
  const finalScore = Math.floor(game.score * (1 + sizeBonus / 100 + healthBonus / 100));

  const getRank = (score: number): { rank: string; color: string } => {
    if (score >= 900) return { rank: 'S', color: '#FFD700' };
    if (score >= 600) return { rank: 'A', color: '#00FF88' };
    if (score >= 400) return { rank: 'B', color: '#88CCFF' };
    if (score >= 200) return { rank: 'C', color: '#FFAA44' };
    return { rank: 'D', color: '#FF6666' };
  };

  const { rank, color } = getRank(finalScore);

  const handleRestart = () => {
    resetGame();
    window.dispatchEvent(new CustomEvent('gameRestart'));
  };

  const handleShare = () => {
    const text = `我在《深渊猎手》中获得了 ${finalScore} 分，评级 ${rank} 级！收集了 ${game.totalCollected} 个浮游生物，最大体型达到 ${Math.round(game.maxSize * 100)}%！`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('战绩已复制到剪贴板！');
      });
    } else {
      alert(text);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={titleStyle}>游戏结束</div>

        <div style={rankContainerStyle}>
          <span style={{ ...rankLabelStyle, color }}>{rank}</span>
          <span style={rankSubStyle}>级评价</span>
        </div>

        <div style={scoreBigStyle}>{finalScore}</div>
        <div style={scoreLabelStyle}>最终得分</div>

        <div style={dividerStyle} />

        <div style={statsContainerStyle}>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>收集总数</span>
            <span style={statValueStyle}>{game.totalCollected}</span>
          </div>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>最大体型</span>
            <span style={statValueStyle}>{Math.round(game.maxSize * 100)}%</span>
          </div>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>剩余生命</span>
            <span style={statValueStyle}>{player.health}</span>
          </div>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>体型加成</span>
            <span style={{ ...statValueStyle, color: '#88FFAA' }}>+{sizeBonus}%</span>
          </div>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>生命加成</span>
            <span style={{ ...statValueStyle, color: '#FF8888' }}>+{healthBonus}%</span>
          </div>
        </div>

        <div style={buttonsContainerStyle}>
          <button style={buttonStyle} onClick={handleRestart} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#00CC77')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00AA55')}>
            重新开始
          </button>
          <button style={{ ...buttonStyle, backgroundColor: '#2255AA' }} onClick={handleShare} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3366CC')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2255AA')}>
            分享战绩
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  fontFamily: '"Courier New", monospace',
};

const panelStyle: React.CSSProperties = {
  width: '400px',
  backgroundColor: '#0A1A2A',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 255, 136, 0.1)',
  border: '1px solid rgba(0, 255, 136, 0.2)',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#888',
  marginBottom: '16px',
  letterSpacing: '4px',
};

const rankContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'baseline',
  marginBottom: '8px',
};

const rankLabelStyle: React.CSSProperties = {
  fontSize: '72px',
  fontWeight: 'bold',
  fontFamily: '"Courier New", monospace',
  textShadow: '0 0 20px currentColor',
};

const rankSubStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#888',
  marginLeft: '8px',
};

const scoreBigStyle: React.CSSProperties = {
  fontSize: '64px',
  fontWeight: 'bold',
  color: '#00FF88',
  fontFamily: '"Courier New", monospace',
  textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
  lineHeight: 1,
};

const scoreLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  marginTop: '4px',
  marginBottom: '20px',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(0, 255, 136, 0.2)',
  margin: '16px 0',
};

const statsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '24px',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 16px',
};

const statLabelStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '14px',
};

const statValueStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 'bold',
};

const buttonsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  backgroundColor: '#00AA55',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontFamily: '"Courier New", monospace',
  transition: 'background-color 200ms ease, transform 100ms ease',
  letterSpacing: '2px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
};

export default GameOverPanel;
