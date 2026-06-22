import { useOceanStore } from '../../store';

const glassPanel: React.CSSProperties = {
  background: 'rgba(10, 22, 40, 0.75)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(0, 229, 255, 0.2)',
  boxShadow: '0 0 15px rgba(0, 229, 255, 0.1)',
  borderRadius: '12px',
};

export default function HoverTooltip() {
  const hoveredSpecies = useOceanStore((s) => s.hoveredSpecies);

  if (!hoveredSpecies) return null;

  const tempBand =
    hoveredSpecies.preferredTemp[0] >= 20
      ? '暖水种'
      : hoveredSpecies.preferredTemp[0] >= 10
      ? '温水种'
      : '冷水种';

  return (
    <div
      style={{
        ...glassPanel,
        position: 'absolute',
        padding: '12px 16px',
        pointerEvents: 'none',
        zIndex: 200,
        minWidth: '180px',
        top: '50%',
        left: '50%',
        transform: 'translate(20px, -50%)',
        transition: 'opacity 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: hoveredSpecies.color,
            boxShadow: `0 0 8px ${hoveredSpecies.color}`,
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, color: hoveredSpecies.color }}>
          {hoveredSpecies.name}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: '8px' }}>
        {hoveredSpecies.latinName}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>深度</span>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px', color: '#00e5ff' }}>
            {hoveredSpecies.depth.toFixed(0)}m
          </div>
        </div>
        <div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>丰度</span>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px', color: '#00e5ff' }}>
            {(hoveredSpecies.abundance * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: '6px',
          padding: '3px 8px',
          borderRadius: '4px',
          background:
            tempBand === '暖水种'
              ? 'rgba(255, 107, 53, 0.2)'
              : tempBand === '温水种'
              ? 'rgba(78, 205, 196, 0.2)'
              : 'rgba(0, 119, 182, 0.2)',
          color:
            tempBand === '暖水种'
              ? '#ff6b35'
              : tempBand === '温水种'
              ? '#4ecdc4'
              : '#00b4d8',
          fontSize: '10px',
          display: 'inline-block',
        }}
      >
        {tempBand}
      </div>
    </div>
  );
}
