import React, { useMemo } from 'react';
import { PlayerData, MonsterConfig, CombatStats, StatePreset, MAX_PRESETS } from './types';

interface ControlPanelProps {
  playerConfig: PlayerData;
  monsterConfig: MonsterConfig;
  combatStats: CombatStats;
  presets: (StatePreset | null)[];
  selectedPreset: number | null;
  onPlayerChange: (key: keyof PlayerData, value: number) => void;
  onMonsterChange: (key: keyof MonsterConfig, value: number) => void;
  onSavePreset: (index: number) => void;
  onLoadPreset: (index: number) => void;
  onReset: () => void;
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: '#2D2D44',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer'
};

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, onChange }) => {
  const trackFill = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#A0A0B0' }}>{label}</span>
        <span style={{ fontSize: 14, color: '#E94560', fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          ...sliderStyle,
          background: `linear-gradient(to right, #E94560 0%, #E94560 ${trackFill}%, #2D2D44 ${trackFill}%, #2D2D44 100%)`
        }}
      />
    </div>
  );
};

const DamageChart: React.FC<{ data: CombatStats['dpsHistory'] }> = ({ data }) => {
  const width = 260;
  const height = 80;
  const padding = { top: 5, right: 5, bottom: 15, left: 30 };

  const pathD = useMemo(() => {
    if (data.length < 2) return '';
    const now = data[data.length - 1].time;
    const startTime = now - 5000;
    const maxDps = Math.max(10, ...data.map((d) => d.dps));

    const points = data.map((d) => {
      const x =
        padding.left +
        ((d.time - startTime) / 5000) * (width - padding.left - padding.right);
      const y =
        height -
        padding.bottom -
        (d.dps / maxDps) * (height - padding.top - padding.bottom);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return 'M' + points.join(' L');
  }, [data]);

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let i = 0; i <= 4; i++) {
      const y =
        padding.top + (i / 4) * (height - padding.top - padding.bottom);
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="#2D2D44"
          strokeWidth={1}
        />
      );
    }
    return lines;
  }, []);

  const maxDps = useMemo(() => {
    if (data.length === 0) return 10;
    return Math.max(10, ...data.map((d) => d.dps));
  }, [data]);

  return (
    <div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {gridLines}
        <text x={2} y={padding.top + 3} fill="#A0A0B0" fontSize={9}>
          {Math.round(maxDps)}
        </text>
        <text x={2} y={height - padding.bottom + 3} fill="#A0A0B0" fontSize={9}>
          0
        </text>
        <text
          x={width - padding.right}
          y={height - 2}
          fill="#A0A0B0"
          fontSize={9}
          textAnchor="end"
        >
          -5s
        </text>
        <text
          x={padding.left}
          y={height - 2}
          fill="#A0A0B0"
          fontSize={9}
        >
          now
        </text>
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#FF6B35"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  playerConfig,
  monsterConfig,
  combatStats,
  presets,
  selectedPreset,
  onPlayerChange,
  onMonsterChange,
  onSavePreset,
  onLoadPreset,
  onReset
}) => {
  const cardStyle: React.CSSProperties = {
    background: '#1A1A2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: '#E94560',
    marginBottom: 12,
    letterSpacing: 0.5
  };

  const presetButton = (index: number, type: 'save' | 'load'): React.CSSProperties => {
    const isSelected = type === 'load' && selectedPreset === index;
    return {
      width: 120,
      height: 36,
      background: isSelected ? '#533483' : '#0F3460',
      color: '#FFFFFF',
      border: isSelected ? '2px solid #E94560' : '2px solid transparent',
      borderRadius: 6,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Segoe UI', sans-serif"
    };
  };

  return (
    <div
      style={{
        width: '30%',
        minWidth: 320,
        background: '#16213E',
        padding: 20,
        overflowY: 'auto',
        fontFamily: "'Segoe UI', sans-serif",
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#E94560',
            margin: 0,
            marginBottom: 4
          }}
        >
          Roguelike Combat Sandbox
        </h1>
        <p style={{ fontSize: 14, color: '#A0A0B0', margin: 0 }}>Version 0.1.0</p>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitle}>Player Properties</h3>
        <Slider
          label="Attack Damage"
          value={playerConfig.attackDamage}
          min={1}
          max={100}
          step={1}
          onChange={(v) => onPlayerChange('attackDamage', v)}
        />
        <Slider
          label="Attack Cooldown (s)"
          value={playerConfig.attackSpeed}
          min={0.1}
          max={2}
          step={0.05}
          onChange={(v) => onPlayerChange('attackSpeed', v)}
        />
        <Slider
          label="Move Speed (px/s)"
          value={playerConfig.moveSpeed}
          min={50}
          max={500}
          step={10}
          onChange={(v) => onPlayerChange('moveSpeed', v)}
        />
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitle}>Monster AI Parameters</h3>
        <Slider
          label="Patrol Speed (px/s)"
          value={monsterConfig.patrolSpeed}
          min={20}
          max={300}
          step={5}
          onChange={(v) => onMonsterChange('patrolSpeed', v)}
        />
        <Slider
          label="Chase Speed (px/s)"
          value={monsterConfig.chaseSpeed}
          min={30}
          max={400}
          step={5}
          onChange={(v) => onMonsterChange('chaseSpeed', v)}
        />
        <Slider
          label="Vision Radius (px)"
          value={monsterConfig.visionRadius}
          min={50}
          max={400}
          step={5}
          onChange={(v) => onMonsterChange('visionRadius', v)}
        />
        <Slider
          label="Attack Interval (s)"
          value={monsterConfig.attackInterval}
          min={0.3}
          max={5}
          step={0.1}
          onChange={(v) => onMonsterChange('attackInterval', v)}
        />
        <Slider
          label="Attack Backswing (s)"
          value={monsterConfig.attackBackswing}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => onMonsterChange('attackBackswing', v)}
        />
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitle}>Combat Stats</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 12
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#A0A0B0' }}>Current DPS</div>
            <div style={{ fontSize: 22, color: '#FF6B35', fontWeight: 700 }}>
              {combatStats.currentDps.toFixed(1)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#A0A0B0' }}>Total Damage</div>
            <div style={{ fontSize: 22, color: '#FFFFFF', fontWeight: 700 }}>
              {combatStats.totalDamage}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#A0A0B0' }}>Hits</div>
            <div style={{ fontSize: 18, color: '#4ADE80', fontWeight: 700 }}>
              {combatStats.hitCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#A0A0B0' }}>Dodges</div>
            <div style={{ fontSize: 18, color: '#60A5FA', fontWeight: 700 }}>
              {combatStats.dodgeCount}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#A0A0B0',
              marginBottom: 4
            }}
          >
            <span>Monster HP</span>
            <span>{combatStats.monsterHpPercent.toFixed(1)}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 10,
              background: '#2D2D44',
              borderRadius: 5,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${combatStats.monsterHpPercent}%`,
                height: '100%',
                background: '#E94560',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#A0A0B0', marginBottom: 4 }}>
            DPS (Last 5s)
          </div>
          <DamageChart data={combatStats.dpsHistory} />
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitle}>Preset Configurations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: MAX_PRESETS }, (_, i) => (
              <button
                key={`save-${i}`}
                onClick={() => onSavePreset(i)}
                style={presetButton(i, 'save')}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#533483')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = selectedPreset === i ? '#533483' : '#0F3460')
                }
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Save {i + 1}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: MAX_PRESETS }, (_, i) => (
              <button
                key={`load-${i}`}
                onClick={() => onLoadPreset(i)}
                style={presetButton(i, 'load')}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#533483')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = selectedPreset === i ? '#533483' : '#0F3460')
                }
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                disabled={!presets[i]}
              >
                {presets[i] ? `Load ${i + 1}` : `Slot ${i + 1}`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onReset}
          style={{
            width: '100%',
            height: 36,
            background: '#E94560',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 12,
            transition: 'all 0.2s ease',
            fontFamily: "'Segoe UI', sans-serif"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#FF6B6B')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#E94560')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Reset Combat
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
