import React from 'react';
import { DEBRIS_NAMES, DEBRIS_COLORS, DebrisType, ORBIT_ZONES } from './types';
import { useGameStore } from './store';

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

const zoneNameStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#FFFFFF',
};

const taskItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  padding: '8px 0',
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

const checkIconStyle = (done: boolean): React.CSSProperties => ({
  marginLeft: 'auto',
  color: done ? '#4CAF50' : '#9E9E9E',
  fontWeight: 700,
  fontSize: 16,
});

const taskTextStyle = (done: boolean): React.CSSProperties => ({
  color: done ? '#4CAF50' : '#CBD5E1',
});

export const TaskPanel: React.FC = () => {
  const currentZoneIndex = useGameStore(s => s.currentZoneIndex);
  const counts = useGameStore(s => s.debrisCounts);
  const zone = ORBIT_ZONES[currentZoneIndex];
  const groupNames: Record<string, string> = {
    low: '低轨道',
    medium: '中轨道',
    high: '高轨道',
  };

  return (
    <div style={panelStyle}>
      <div>
        <div style={labelStyle}>当前轨道</div>
        <div style={zoneNameStyle}>{zone.name}</div>
        <div style={{ fontSize: 12, color: '#60A5FA', marginTop: 2 }}>
          {groupNames[zone.group]} · 区域 {currentZoneIndex + 1} / {ORBIT_ZONES.length}
        </div>
      </div>

      <div>
        <div style={labelStyle}>任务目标</div>
        {zone.tasks.map((task, idx) => {
          const done = counts[task.type] >= task.count;
          const types: DebrisType[] = ['metal', 'plastic', 'electronic'];
          return (
            <div key={idx} style={taskItemStyle}>
              <span style={colorDot(DEBRIS_COLORS[task.type])} />
              <span style={taskTextStyle(done)}>
                捕获 {task.count} 个{DEBRIS_NAMES[types[idx % 3]]}
              </span>
              <span style={checkIconStyle(done)}>{done ? '✓' : '○'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
