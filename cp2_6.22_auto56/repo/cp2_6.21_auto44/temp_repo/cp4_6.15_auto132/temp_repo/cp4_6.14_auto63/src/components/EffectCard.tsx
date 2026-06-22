import { EffectType, EFFECT_CONFIGS } from '@types/index';

interface EffectCardProps {
  type: EffectType;
  draggable?: boolean;
}

export function EffectCard({ type, draggable = true }: EffectCardProps) {
  const config = EFFECT_CONFIGS[type];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('effectType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      style={{
        width: '120px',
        height: '40px',
        borderRadius: '6px',
        backgroundColor: '#334155',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 10px',
        cursor: draggable ? 'grab' : 'pointer',
        transition: 'all 0.15s ease',
        border: '1px solid transparent',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#60a5fa';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: '16px' }}>{config.icon}</span>
      <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>
        {config.name.split(' ')[0]}
      </span>
    </div>
  );
}
