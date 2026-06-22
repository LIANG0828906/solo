import React from 'react';
import { CreatureType, CREATURE_NAMES, CREATURE_COLORS } from '../types';

interface ControlPanelProps {
  isRunning: boolean;
  speed: number;
  selectedCreature: CreatureType | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onSelectCreature: (type: CreatureType | null) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  speed,
  selectedCreature,
  onStart,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  onSelectCreature,
}) => {
  const creatureTypes = [
    CreatureType.PRODUCER,
    CreatureType.PRIMARY_CONSUMER,
    CreatureType.SECONDARY_CONSUMER,
    CreatureType.DECOMPOSER,
  ];

  const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    background: 'rgba(0, 0, 0, 0.5)',
    color: '#E2E8F0',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'monospace',
  };

  const buttonHoverStyle: React.CSSProperties = {
    background: 'rgba(100, 200, 255, 0.2)',
    borderColor: 'rgba(100, 200, 255, 0.5)',
  };

  return (
    <div
      style={{
        width: 200,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        backdropFilter: 'blur(10px)',
      }}
    >
      <h2
        style={{
          color: '#E2E8F0',
          fontSize: 16,
          margin: 0,
          marginBottom: 8,
          fontFamily: 'monospace',
          letterSpacing: 1,
        }}
      >
        控制面板
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          style={{
            ...buttonStyle,
            background: isRunning ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
          }}
          onClick={isRunning ? onPause : onStart}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isRunning
              ? 'rgba(239, 68, 68, 0.5)'
              : 'rgba(34, 197, 94, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isRunning
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(34, 197, 94, 0.3)';
          }}
        >
          {isRunning ? '⏸ 暂停' : '▶ 运行'}
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...buttonStyle, flex: 1, padding: '12px 8px' }}
            onClick={onStep}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, buttonHoverStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            }}
          >
            ⏭ 步进
          </button>
          <button
            style={{ ...buttonStyle, flex: 1, padding: '12px 8px' }}
            onClick={onReset}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, buttonHoverStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            }}
          >
            ↺ 重置
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label
          style={{
            color: '#E2E8F0',
            fontSize: 12,
            fontFamily: 'monospace',
            opacity: 0.8,
          }}
        >
          速度: {speed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#60A5FA',
            height: 6,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            appearance: 'none',
            outline: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#94A3B8',
            fontFamily: 'monospace',
          }}
        >
          <span>0.5x</span>
          <span>4x</span>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <label
          style={{
            color: '#E2E8F0',
            fontSize: 12,
            fontFamily: 'monospace',
            opacity: 0.8,
          }}
        >
          投放物种
        </label>
        {creatureTypes.map((type) => (
          <button
            key={type}
            style={{
              ...buttonStyle,
              padding: '10px 16px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderColor:
                selectedCreature === type
                  ? CREATURE_COLORS[type]
                  : 'rgba(255, 255, 255, 0.2)',
              background:
                selectedCreature === type
                  ? `${CREATURE_COLORS[type]}33`
                  : 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() =>
              onSelectCreature(selectedCreature === type ? null : type)
            }
            onMouseEnter={(e) => {
              if (selectedCreature !== type) {
                e.currentTarget.style.background = `${CREATURE_COLORS[type]}22`;
                e.currentTarget.style.borderColor = `${CREATURE_COLORS[type]}66`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCreature !== type) {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: type === CreatureType.PRODUCER || type === CreatureType.SECONDARY_CONSUMER ? '50%' : 0,
                background: CREATURE_COLORS[type],
                boxShadow: `0 0 8px ${CREATURE_COLORS[type]}`,
                clipPath:
                  type === CreatureType.PRIMARY_CONSUMER
                    ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                    : type === CreatureType.DECOMPOSER
                    ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                    : undefined,
              }}
            />
            <span style={{ fontSize: 13 }}>{CREATURE_NAMES[type]}</span>
          </button>
        ))}
        {selectedCreature && (
          <p
            style={{
              color: '#60A5FA',
              fontSize: 11,
              margin: 0,
              fontFamily: 'monospace',
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            点击缸内任意位置投放
          </p>
        )}
      </div>
    </div>
  );
};
