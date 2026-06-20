import { EffectCard } from './EffectCard';
import { EffectType, EFFECT_CONFIGS } from '@types/index';

interface EffectManagerProps {
  isOpen?: boolean;
}

export function EffectManager({ isOpen = true }: EffectManagerProps) {
  const effectTypes: EffectType[] = ['eq', 'compressor', 'reverb', 'delay', 'distortion'];

  if (!isOpen) return null;

  return (
    <div
      className="slide-in-right"
      style={{
        width: '280px',
        backgroundColor: '#1e293b',
        borderLeft: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #334155',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
          效果器库
        </h3>
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>
          拖拽效果器到轨道插槽中
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {effectTypes.map((type) => (
            <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <EffectCard type={type} />
              <span style={{ fontSize: '10px', color: '#64748b', paddingLeft: '4px' }}>
                {EFFECT_CONFIGS[type].name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #334155',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
          💡 提示：每条轨道最多挂载4个效果器
        </div>
      </div>
    </div>
  );
}
