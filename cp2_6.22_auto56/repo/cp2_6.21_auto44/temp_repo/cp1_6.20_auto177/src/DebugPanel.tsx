import { DebugInfo, TrapState } from './trapData';

interface DebugPanelProps {
  debugInfo: DebugInfo | null;
}

export default function DebugPanel({ debugInfo }: DebugPanelProps) {
  if (!debugInfo) return null;

  const stateColor: Record<TrapState, string> = {
    standby: '#4fc3f7',
    triggered: '#e94560',
    cooldown: '#ffa726',
  };

  const stateLabel: Record<TrapState, string> = {
    standby: '待命',
    triggered: '触发',
    cooldown: '冷却',
  };

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      bottom: 16,
      background: 'rgba(22, 33, 62, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(233, 69, 96, 0.2)',
      borderRadius: 12,
      padding: '14px 18px',
      minWidth: 240,
      zIndex: 10,
      fontFamily: 'var(--font-ui)',
    }}>
      <div style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 10,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#4caf50',
          display: 'inline-block',
          animation: 'pulse 1s infinite',
        }} />
        实时调试
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>状态</span>
          <span style={{ color: stateColor[debugInfo.state], fontWeight: 700 }}>
            {stateLabel[debugInfo.state]}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>碰撞箱</span>
          <span style={{ color: '#fff', fontWeight: 500, fontFamily: 'monospace', fontSize: 11 }}>
            {debugInfo.collisionBox.x.toFixed(1)}, {debugInfo.collisionBox.y.toFixed(1)}, {debugInfo.collisionBox.z.toFixed(1)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>尺寸</span>
          <span style={{ color: '#fff', fontWeight: 500, fontFamily: 'monospace', fontSize: 11 }}>
            {debugInfo.collisionBox.width.toFixed(1)} × {debugInfo.collisionBox.height.toFixed(1)} × {debugInfo.collisionBox.depth.toFixed(1)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>伤害范围</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
            {debugInfo.damageRange.toFixed(1)}m
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
