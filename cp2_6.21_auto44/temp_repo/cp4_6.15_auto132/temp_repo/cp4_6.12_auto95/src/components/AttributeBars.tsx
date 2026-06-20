import React from 'react';

interface AttributeBarProps {
  label: string;
  value: number;
  icon: string;
  warningThreshold?: number;
}

const AttributeBar: React.FC<AttributeBarProps> = ({
  label,
  value,
  icon,
  warningThreshold = 20,
}) => {
  const isWarning = value < warningThreshold;
  const clampedValue = Math.max(0, Math.min(100, value));

  const getGradientStyle = () => {
    const ratio = clampedValue / 100;
    return {
      width: `${clampedValue}%`,
      background: `linear-gradient(90deg, #ff4444 0%, ${
        ratio < 0.5
          ? `#ff922b ${ratio * 100}%`
          : `#ff922b 50%, #44ff44 100%`
      })`,
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: isWarning ? '#ef4444' : '#334155',
              transition: 'color 0.3s ease',
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: isWarning ? '#ef4444' : '#1e293b',
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.3s ease',
          }}
        >
          {Math.round(clampedValue)}%
        </span>
      </div>
      <div
        style={{
          width: '180px',
          maxWidth: '100%',
          height: '10px',
          borderRadius: '5px',
          backgroundColor: '#e2e8f0',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '5px',
            transition: 'width 0.3s ease, background 0.3s ease',
            ...getGradientStyle(),
          }}
        />
      </div>
    </div>
  );
};

interface AttributeBarsProps {
  hunger: number;
  mood: number;
  energy: number;
  intelligence: number;
}

export const AttributeBars: React.FC<AttributeBarsProps> = ({
  hunger,
  mood,
  energy,
  intelligence,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px 24px',
        padding: '16px 20px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      <AttributeBar label="饥饿度" value={hunger} icon="🍖" />
      <AttributeBar label="心情值" value={mood} icon="😊" />
      <AttributeBar label="活力" value={energy} icon="⚡" />
      <AttributeBar label="智力" value={intelligence} icon="🧠" />
    </div>
  );
};
