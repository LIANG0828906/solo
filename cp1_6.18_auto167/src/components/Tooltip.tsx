import { useAppStore } from '@/store/useAppStore';

function Tooltip() {
  const { tooltipData, buildings, selectedBuildingId } = useAppStore();

  if (!tooltipData) return null;

  const building = buildings.find(b => b.id === tooltipData.id);
  if (!building) return null;

  const isSelected = selectedBuildingId === building.id;

  const left = Math.min(
    tooltipData.x + 16,
    typeof window !== 'undefined' ? window.innerWidth - 140 : tooltipData.x + 16,
  );
  const top = Math.max(
    tooltipData.y - 70,
    10,
  );

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: '120px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '12px',
        color: '#FFFFFF',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        pointerEvents: 'none',
        zIndex: 1000,
        lineHeight: '1.6',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontWeight: 600,
          color: '#81ECEC',
        }}
      >
        <span>建筑 #{building.id}</span>
        {isSelected && <span style={{ color: '#FF6B6B', fontSize: '10px' }}>已选中</span>}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
          color: '#A0A0A0',
        }}
      >
        <span>高度</span>
        <span style={{ color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
          {tooltipData.height.toFixed(2)}u
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#A0A0A0' }}>颜色</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: tooltipData.color,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
          <span style={{ color: '#FFFFFF', fontFamily: 'monospace', fontSize: '11px' }}>
            {tooltipData.color.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Tooltip;
