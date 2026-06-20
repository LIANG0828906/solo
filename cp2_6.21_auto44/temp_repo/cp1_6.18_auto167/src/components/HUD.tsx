import { useAppStore } from '@/store/useAppStore';

function HUD() {
  const { fps, visibleBuildings } = useAppStore();

  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        bottom: 20,
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '16px',
        color: '#A0A0A0',
        fontVariantNumeric: 'tabular-nums',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10,
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: fps >= 50 ? '#00D68F' : fps >= 30 ? '#FFAA00' : '#FF5B5B',
            boxShadow: `0 0 6px ${fps >= 50 ? '#00D68F' : fps >= 30 ? '#FFAA00' : '#FF5B5B'}`,
          }}
        />
        <span>FPS</span>
        <span
          style={{
            color: fps >= 50 ? '#00D68F' : fps >= 30 ? '#FFAA00' : '#FF5B5B',
            fontWeight: 600,
            minWidth: '30px',
            textAlign: 'right',
          }}
        >
          {fps}
        </span>
      </div>
      <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>🏢</span>
        <span
          style={{
            color: '#81ECEC',
            fontWeight: 600,
          }}
        >
          {visibleBuildings}
        </span>
      </div>
    </div>
  );
}

export default HUD;
