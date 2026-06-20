import React from 'react';
import { DEBRIS_NAMES, DEBRIS_COLORS, DebrisType } from './types';
import { useGameStore } from './store';
import { formatTime } from './gameUtils';

const panelStyle: React.CSSProperties = {
  width: 220,
  background: 'rgba(15, 20, 51, 0.7)',
  borderRadius: 10,
  padding: 20,
  color: '#E0E7FF',
  fontFamily: '"Segoe UI", sans-serif',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxSizing: 'border-box',
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94A3B8',
  letterSpacing: 0.5,
  marginBottom: 4,
  textTransform: 'uppercase' as const,
};

const scoreStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: '#FFFFFF',
};

const timeStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: '#93C5FD',
  fontVariantNumeric: 'tabular-nums' as const,
};

const debrisItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 14,
  padding: '6px 0',
};

const colorDot = (color: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color,
  display: 'inline-block',
  marginRight: 8,
  flexShrink: 0,
});

export const ScorePanel: React.FC = () => {
  const score = useGameStore(s => s.score);
  const timeRemaining = useGameStore(s => s.timeRemaining);
  const counts = useGameStore(s => s.debrisCounts);
  const types: DebrisType[] = ['metal', 'plastic', 'electronic'];

  return (
    <div style={panelStyle}>
      <div>
        <div style={labelStyle}>当前分数</div>
        <div style={scoreStyle}>{score}</div>
      </div>

      <div>
        <div style={labelStyle}>剩余时间</div>
        <div style={timeStyle}>{formatTime(timeRemaining)}</div>
      </div>

      <div>
        <div style={labelStyle}>已捕获碎片</div>
        {types.map(t => (
          <div key={t} style={debrisItemStyle}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={colorDot(DEBRIS_COLORS[t])} />
              <span style={{ color: '#CBD5E1' }}>{DEBRIS_NAMES[t]}</span>
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{counts[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
