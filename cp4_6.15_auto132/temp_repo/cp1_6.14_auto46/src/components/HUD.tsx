import React from 'react';
import { HUDData } from '../types';

interface HUDProps {
  data: HUDData;
}

const barStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 12,
  borderRadius: 6,
  background: 'rgba(10, 15, 30, 0.6)',
  border: '1px solid rgba(127, 219, 255, 0.2)',
  overflow: 'hidden',
};

const barFillStyle = (pct: number, color: string): React.CSSProperties => ({
  height: '100%',
  width: `${Math.max(0, Math.min(100, pct))}%`,
  borderRadius: 6,
  background: color,
  transition: 'width 0.25s ease-out',
  boxShadow: `0 0 8px ${color}`,
});

const panelStyle: React.CSSProperties = {
  background: 'rgba(10, 15, 30, 0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(127, 219, 255, 0.25)',
  borderRadius: 10,
  padding: '10px 14px',
  boxShadow: '0 0 20px rgba(127, 219, 255, 0.06), inset 0 0 15px rgba(127, 219, 255, 0.03)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(180, 200, 230, 0.8)',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 3,
  fontFamily: '"Consolas", "Courier New", monospace',
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#e0eaff',
  fontFamily: '"Consolas", "Courier New", monospace',
};

const HUD: React.FC<HUDProps> = React.memo(({ data }) => {
  if (data.phase !== 'playing') return null;

  const healthPct = (data.health / data.maxHealth) * 100;
  const shieldPct = (data.shield / data.maxShield) * 100;
  const energyPct = (data.energy / data.maxEnergy) * 100;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: '"Consolas", "Courier New", monospace' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, width: 200, display: 'flex', flexDirection: 'column', gap: 8, ...panelStyle, padding: '12px 14px' }}>
        <div>
          <div style={labelStyle}>血量</div>
          <div style={barStyle}>
            <div style={barFillStyle(healthPct, healthPct > 30 ? '#ff4466' : '#ff2244')} />
          </div>
        </div>
        <div>
          <div style={labelStyle}>护盾</div>
          <div style={barStyle}>
            <div style={barFillStyle(shieldPct, '#4488ff')} />
          </div>
        </div>
        <div>
          <div style={labelStyle}>能量</div>
          <div style={barStyle}>
            <div style={barFillStyle(energyPct, '#00ddcc')} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, ...panelStyle, padding: '12px 16px', textAlign: 'right' }}>
        <div style={labelStyle}>关卡</div>
        <div style={{ ...valueStyle, fontSize: 22, color: '#7fdbff' }}>{data.level}</div>
      </div>

      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', ...panelStyle, padding: '10px 20px', textAlign: 'center' }}>
        <div style={labelStyle}>碎片清理</div>
        <div style={valueStyle}>
          <span style={{ color: '#7fdbff', fontSize: 20 }}>{data.collectedCount}</span>
          <span style={{ color: 'rgba(180, 200, 230, 0.5)', fontSize: 14 }}> / {data.targetCount}</span>
        </div>
        <div style={{ marginTop: 6, width: 160, ...barStyle }}>
          <div style={barFillStyle((data.collectedCount / data.targetCount) * 100, '#7fdbff')} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: 16, ...panelStyle, padding: '8px 14px' }}>
        <div style={labelStyle}>得分</div>
        <div style={{ ...valueStyle, color: '#ffcc44' }}>{data.score.toLocaleString()}</div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 8 }}>
        {data.timeSlowActive && (
          <div style={{ ...panelStyle, padding: '6px 12px', border: '1px solid rgba(204, 68, 255, 0.5)' }}>
            <span style={{ fontSize: 11, color: '#cc44ff', fontWeight: 700 }}>⏳ 时间减速</span>
          </div>
        )}
        {data.shieldBoostActive && (
          <div style={{ ...panelStyle, padding: '6px 12px', border: '1px solid rgba(68, 136, 255, 0.5)' }}>
            <span style={{ fontSize: 11, color: '#4488ff', fontWeight: 700 }}>🛡 护盾强化</span>
          </div>
        )}
        {data.beamActive && (
          <div style={{ ...panelStyle, padding: '6px 12px', border: '1px solid rgba(0, 221, 204, 0.5)' }}>
            <span style={{ fontSize: 11, color: '#00ddcc', fontWeight: 700 }}>◎ 光束激活</span>
          </div>
        )}
      </div>
    </div>
  );
});

HUD.displayName = 'HUD';

export default HUD;
