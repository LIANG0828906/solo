import React from 'react';
import { useGameStore } from '../state/StateManager';

const HeartIcon: React.FC<{ filled: boolean; isShield?: boolean }> = ({ filled, isShield }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" style={{ filter: filled ? `drop-shadow(0 0 6px ${isShield ? '#4488FF' : '#FF4444'})` : 'none' }}>
    {isShield ? (
      <path
        d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
        fill={filled ? '#4488FF' : '#1A2A4A'}
        stroke={filled ? '#66AAFF' : '#2A3A5A'}
        strokeWidth="1.5"
      />
    ) : (
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? '#FF4444' : '#2A1A1A'}
        stroke={filled ? '#FF6666' : '#3A2A2A'}
        strokeWidth="1.5"
      />
    )}
  </svg>
);

const UIPanel: React.FC = () => {
  const { player, game, planktons } = useGameStore();

  const glowProgress = React.useMemo(() => {
    const now = Date.now();
    if (player.isGlowing) {
      const elapsed = now - player.glowStartTime;
      return 1 - elapsed / 2000;
    }
    if (now < player.glowCooldownEnd) {
      const remaining = player.glowCooldownEnd - now;
      return 1 - remaining / 3000;
    }
    return 1;
  }, [player.isGlowing, player.glowStartTime, player.glowCooldownEnd, game.score]);

  const isGlowReady = !player.isGlowing && Date.now() >= player.glowCooldownEnd;
  const isDoubleScoreActive = Date.now() < player.doubleScoreEnd;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const collectionProgress = Math.min(100, (planktons.length / 100) * 100);

  return (
    <>
      <div style={topBarStyle}>
        <div style={scoreContainerStyle}>
          <span style={{ color: '#888', fontSize: '12px' }}>得分</span>
          <span
            style={{
              ...scoreStyle,
              transition: 'color 300ms ease',
            }}
            key={game.score}
          >
            {game.score}
          </span>
          {isDoubleScoreActive && (
            <span style={{ color: '#FF8800', fontSize: '14px', marginLeft: '8px' }}>×2</span>
          )}
        </div>
        <div style={titleStyle}>深渊猎手</div>
        <div style={timerStyle}>
          <span style={{ color: '#888', fontSize: '12px' }}>剩余时间</span>
          <span style={{ color: game.timeRemaining < 30 ? '#FF4444' : '#FFFFFF', fontSize: '24px', fontWeight: 'bold' }}>
            {formatTime(game.timeRemaining)}
          </span>
        </div>
      </div>

      <div style={leftPanelStyle}>
        <div style={panelHeaderStyle}>生命值</div>
        <div style={heartsContainerStyle}>
          {Array.from({ length: player.maxHealth }).map((_, i) => (
            <HeartIcon key={`h-${i}`} filled={i < player.health} />
          ))}
        </div>
        <div style={{ ...panelHeaderStyle, marginTop: '12px' }}>护盾</div>
        <div style={heartsContainerStyle}>
          {Array.from({ length: player.maxShield }).map((_, i) => (
            <HeartIcon key={`s-${i}`} filled={i < player.shield} isShield />
          ))}
        </div>
        <div style={{ ...panelHeaderStyle, marginTop: '12px' }}>体型</div>
        <div style={{ color: '#00FF88', fontSize: '16px', fontWeight: 'bold' }}>
          {Math.round(player.size * 100)}%
        </div>
        {player.combo > 0 && (
          <div style={{ marginTop: '12px', color: '#FFAA00', fontSize: '14px' }}>
            连击: {player.combo}
          </div>
        )}
      </div>

      <div style={rightPanelStyle}>
        <div style={panelHeaderStyle}>浮游生物</div>
        <div style={dotsContainerStyle}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...dotStyle,
                backgroundColor: i < collectionProgress / 5 ? '#00FF88' : '#1A3A2A',
                boxShadow: i < collectionProgress / 5 ? '0 0 4px #00FF88' : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ color: '#88FFAA', fontSize: '14px', marginTop: '8px' }}>
          {planktons.length} / 100
        </div>
        <div style={{ ...panelHeaderStyle, marginTop: '16px' }}>收集数</div>
        <div style={{ color: '#00FF88', fontSize: '20px', fontWeight: 'bold' }}>
          {game.totalCollected}
        </div>
        <div style={{ ...panelHeaderStyle, marginTop: '16px' }}>难度</div>
        <div style={{ color: '#FF8844', fontSize: '16px' }}>
          Lv.{game.difficultyLevel + 1}
        </div>
        {game.tideActive && (
          <div style={{ marginTop: '12px', color: '#6688FF', fontSize: '14px', animation: 'pulse 1s infinite' }}>
            🌊 深蓝潮汐
          </div>
        )}
      </div>

      <div style={bottomBarStyle}>
        <div style={glowBarContainerStyle}>
          <span style={{ color: '#888', fontSize: '12px', marginRight: '8px' }}>发光能量</span>
          <div style={glowBarBgStyle}>
            <div
              style={{
                ...glowBarFillStyle,
                width: `${glowProgress * 100}%`,
                backgroundColor: player.isGlowing ? '#88FFAA' : isGlowReady ? '#00FF88' : '#446655',
                boxShadow: player.isGlowing ? '0 0 10px #00FF88' : 'none',
              }}
            />
          </div>
          <span style={{ color: isGlowReady ? '#00FF88' : '#666', fontSize: '12px', marginLeft: '8px' }}>
            {player.isGlowing ? '发光中...' : isGlowReady ? '按空格' : '冷却中'}
          </span>
        </div>
        <div style={controlsHintStyle}>
          <span style={keyHintStyle}>W A S D</span> 移动
          <span style={{ ...keyHintStyle, marginLeft: '12px' }}>空格</span> 发光
        </div>
      </div>
    </>
  );
};

const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '800px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 4px',
  pointerEvents: 'none',
};

const scoreContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const scoreStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#00FF88',
  fontFamily: '"Courier New", monospace',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#00FF88',
  fontFamily: '"Courier New", monospace',
  textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
  letterSpacing: '4px',
};

const timerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  fontFamily: '"Courier New", monospace',
};

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: '#0A1A2A',
  borderRadius: '12px',
  padding: '12px',
  boxShadow: '2px 2px 6px rgba(0,0,0,0.4)',
  fontFamily: '"Courier New", monospace',
  pointerEvents: 'none',
};

const leftPanelStyle: React.CSSProperties = {
  ...panelStyle,
  left: 'calc(50% - 400px - 140px)',
  width: '120px',
};

const rightPanelStyle: React.CSSProperties = {
  ...panelStyle,
  right: 'calc(50% - 400px - 140px)',
  width: '120px',
  textAlign: 'right',
};

const panelHeaderStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '12px',
  marginBottom: '8px',
};

const heartsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
};

const dotsContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(10, 1fr)',
  gap: '4px',
  justifyContent: 'end',
};

const dotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  transition: 'all 200ms ease',
};

const bottomBarStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '800px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  pointerEvents: 'none',
  fontFamily: '"Courier New", monospace',
};

const glowBarContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(10, 26, 42, 0.8)',
  borderRadius: '8px',
  padding: '8px 16px',
  boxShadow: '2px 2px 6px rgba(0,0,0,0.4)',
};

const glowBarBgStyle: React.CSSProperties = {
  width: '200px',
  height: '12px',
  backgroundColor: '#1A2A3A',
  borderRadius: '6px',
  overflow: 'hidden',
};

const glowBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '6px',
  transition: 'width 100ms linear, background-color 300ms ease',
};

const controlsHintStyle: React.CSSProperties = {
  color: '#668',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
};

const keyHintStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1A2A3A',
  color: '#88FFAA',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  margin: '0 4px',
  border: '1px solid #2A3A4A',
};

export default UIPanel;
