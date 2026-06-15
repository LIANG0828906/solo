import * as THREE from 'three';

const labels = [
  { depth: 0, label: '海面 0m', y: 2.2 },
  { depth: 200, label: '200m', y: -100 },
  { depth: 500, label: '500m', y: -250 },
  { depth: 1000, label: '1000m', y: -500 },
];

export default function DepthMarkers() {
  const groupStyle: React.CSSProperties = {
    position: 'absolute',
    left: '70px',
    pointerEvents: 'none',
    zIndex: 40,
    fontFamily: "'Orbitron', sans-serif",
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '52px',
        top: '50%',
        transform: 'translateY(-50%)',
        height: '65%',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '2px',
          background:
            'linear-gradient(180deg, rgba(0,229,255,0.4) 0%, rgba(0,229,255,0.08) 80%, rgba(0,229,255,0) 100%)',
        }}
      />

      {labels.map((l, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i / (labels.length - 1)) * 100}%`,
            transform: 'translateY(-50%)',
            left: '-4px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '2px',
              background: 'rgba(0, 229, 255, 0.6)',
              boxShadow: '0 0 6px rgba(0, 229, 255, 0.6)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '9px',
              color: 'rgba(0, 229, 255, 0.55)',
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
            }}
          >
            {l.label}
          </div>
        </div>
      ))}

      <div style={groupStyle} />
    </div>
  );
}
